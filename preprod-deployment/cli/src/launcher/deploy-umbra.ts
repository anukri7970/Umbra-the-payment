import { WebSocket } from 'ws';
globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PreprodRemoteConfig } from '../config.js';
import { MidnightWalletProvider } from '../midnight-wallet-provider.js';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledUmbraPayrollContract } from '@midnight-ntwrk/umbra-contract';
import { createLogger } from '../logger-utils.js';
import { getUnshieldedAddress } from '../wallet-utils.js';
import { generateDust } from '../generate-dust.js';
import { unshieldedToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { FaucetClient } from '@midnight-ntwrk/testkit-js';
import * as Rx from 'rxjs';

async function main() {
  console.log('=============================================================');
  console.log('  Umbra Payroll — Deploying Contract to Midnight Preprod');
  console.log('=============================================================');

  const seed = process.env.WALLET_SEED;
  if (!seed) throw new Error('WALLET_SEED environment variable is required');

  const config = new PreprodRemoteConfig();
  const logger = await createLogger(config.logDir, false);
  const testEnv = config.getEnvironment(logger);

  console.log('Starting Preprod environment...');
  let envConfiguration: any;
  try {
    envConfiguration = await testEnv.start();
  } catch (err: any) {
    try {
      envConfiguration = testEnv.getEnvironmentConfiguration();
      console.warn(
        'Notice: Public faucet is temporarily offline (503), ' +
        'but node, indexer, and proof server are healthy. Continuing with funded wallet...'
      );
    } catch {
      throw err;
    }
  }

  console.log('Building wallet provider from seed...');
  const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, seed);
  await walletProvider.start();

  const walletAddress = await getUnshieldedAddress(logger, walletProvider.wallet);
  console.log(`Deployment wallet address: ${walletAddress}`);

  // ---- Fund check --------------------------------------------------------
  console.log('Syncing unshielded wallet with Preprod...');
  let unshieldedState = await walletProvider.wallet.unshielded.waitForSyncedState();
  let nightBalance = unshieldedState.balances[unshieldedToken().raw] ?? 0n;
  console.log(`Current tNIGHT balance: ${nightBalance}`);

  if (nightBalance === 0n) {
    console.log('Wallet has 0 tNIGHT. Requesting funds from faucet...');
    if (envConfiguration.faucet) {
      try {
        await new FaucetClient(envConfiguration.faucet, logger).requestTokens(walletAddress);
        console.log('Faucet request sent. Waiting for tokens...');
      } catch (e: any) {
        console.warn(`Faucet request warning: ${e.message}`);
      }
    }

    unshieldedState = await Rx.firstValueFrom(
      walletProvider.wallet.unshielded.state.pipe(
        Rx.sampleTime(5000),
        Rx.tap((state) => {
          const bal = state.balances[unshieldedToken().raw] ?? 0n;
          console.log(`Waiting for tokens... balance: ${bal} tNIGHT`);
        }),
        Rx.filter((state) => (state.balances[unshieldedToken().raw] ?? 0n) > 0n),
        Rx.timeout(300000)
      )
    );
    nightBalance = unshieldedState.balances[unshieldedToken().raw] ?? 0n;
    console.log(`Received funds! Balance: ${nightBalance} tNIGHT`);
  }

  // ---- DUST sync (fast 5000-batch) ---------------------------------------
  console.log('Syncing DUST wallet (fast batch sync)...');
  let lastLoggedPct = -1;
  const dustSub = walletProvider.wallet.dust.state.pipe(
    Rx.sampleTime(5000),
  ).subscribe((s) => {
    const p = s.progress as any;
    const applied = Number(p?.appliedIndex ?? 0);
    const highest = Number(p?.highestRelevantWalletIndex ?? p?.highestIndex ?? 1520000);
    const pct = highest > 0 ? Math.floor((applied * 100) / highest) : 0;
    if (pct !== lastLoggedPct) {
      lastLoggedPct = pct;
      const memMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      console.log(`DUST sync: ${pct}% (${applied}/${highest}, heap: ${memMb}MB)`);
      if (typeof (globalThis as any).gc === 'function') {
        try { (globalThis as any).gc(); } catch {}
      }
    }
  });

  await walletProvider.wallet.dust.waitForSyncedState(100n);
  dustSub.unsubscribe();
  console.log('DUST wallet fully synchronized!');

  // ---- DUST registration -------------------------------------------------
  console.log('Checking / Registering DUST generation...');
  const dustTx = await generateDust(logger, seed, unshieldedState, walletProvider.wallet);
  if (dustTx) {
    console.log(`Registered DUST generation tx: ${dustTx}`);
    console.log('Waiting for registered UTXO to be included in block...');
    await walletProvider.wallet.dust.waitForSyncedState(100n);
  } else {
    console.log('DUST already registered.');
  }

  console.log('Waiting for DUST accrual...');
  const dustBalance = await Rx.firstValueFrom(
    walletProvider.wallet.state().pipe(
      Rx.sampleTime(2000),
      Rx.filter((s) => s.dust.balance(new Date()) > 0n),
      Rx.map((s) => s.dust.balance(new Date())),
      Rx.timeout(300000),
    ),
  );
  console.log(`DUST available: ${dustBalance}! Deploying Umbra contract...`);

  // ---- Deploy ------------------------------------------------------------
  console.log('Initializing providers...');
  const zkConfigProvider = new NodeZkConfigProvider(config.zkConfigPath);
  const storagePassword = 'TempPassword123!Secure';

  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: config.privateStateStoreName,
      signingKeyStoreName: `${config.privateStateStoreName}-signing-keys`,
      privateStoragePasswordProvider: () => storagePassword,
      accountId: seed,
    }),
    publicDataProvider: indexerPublicDataProvider(envConfiguration.indexer, envConfiguration.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(envConfiguration.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };

  console.log('Deploying Umbra Payroll contract...');
  let success = false;
  try {
    // Umbra payroll constructor takes no arguments — pool state starts at 0
    const deployed = await deployContract(providers, {
      compiledContract: CompiledUmbraPayrollContract,
      args: [],
    });

    const contractAddress = deployed.deployTxData.public.contractAddress;
    const explorerUrl = `https://preprod.midnight.network/contract/${contractAddress}`;
    const oneamExplorerUrl = `https://explorer.1am.xyz/contract/${contractAddress}?network=preprod`;

    console.log('');
    console.log('================================================================================');
    console.log('🎉  SUCCESS! UMBRA PAYROLL CONTRACT DEPLOYED TO MIDNIGHT PREPROD!');
    console.log('================================================================================');
    console.log(`CONTRACT_ADDRESS=${contractAddress}`);
    console.log(`MIDNIGHT_EXPLORER=${explorerUrl}`);
    console.log(`ONEAM_EXPLORER=${oneamExplorerUrl}`);
    console.log('================================================================================');

    const deploymentInfo = {
      network: 'preprod',
      contractName: 'UmbraPayroll',
      contractAddress,
      explorerUrl,
      oneamExplorerUrl,
      indexer: envConfiguration.indexer,
      node: envConfiguration.node,
      deployedAt: new Date().toISOString(),
    };

    fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
    fs.writeFileSync('../../deployed_contract.json', JSON.stringify(deploymentInfo, null, 2));
    console.log('Deployment info written to deployment.json and deployed_contract.json');
    success = true;
  } catch (err) {
    console.error('Deployment failed:', err);
  } finally {
    await walletProvider.stop();
    await testEnv.shutdown();
    process.exit(success ? 0 : 1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
