/*
 * Copyright 2018-2020 TON DEV SOLUTIONS LTD.
 */

// @flow

import { TONErrorCode, TONErrorSource } from '../src/TONClient';
import { ABIVersions, nodeSe, tests } from './_/init-tests';
import { TONMnemonicDictionary } from '../src/modules/TONCryptoModule';

const WalletContractPackage = tests.loadPackage('WalletContract');
const HelloContractPackage = tests.loadPackage('Hello');

beforeAll(tests.init);
afterAll(tests.done);

declare function fail(message: string): void;

async function expectError(
    code: number,
    source: ?string,
    message: ?string,
    f: () => Promise<void>,
) {
    try {
        await f();
        // $FlowFixMe
        fail(`Expected error with code:${code} source: ${source}`);
    } catch (error) {
        expect({
            code: error.code,
            ...(source ? { source: error.source } : {}),
        })
            .toEqual({
                code,
                ...(source ? { source } : {}),
            });
        if (message) {
            expect(error.message)
                .toMatch(message);
        }
    }
}

async function expectErrorCode(code: number, f: () => Promise<void>) {
    return expectError(code, null, null, f);
}

test.each(ABIVersions)('Detailed errors (ABI v%i)', async (abiVersion) => {
    let config = {};
    if (abiVersion == 1) {
        config = {
            messageProcessingTimeout: 10000,      
        }
    } else {
        config = {
            messageExpirationTimeout: 2000
        };
    };

    const { contracts, crypto } = await tests.createClient(config);
    
    const helloPackage = HelloContractPackage[abiVersion];

    let helloKeys = await crypto.ed25519Keypair();
    let helloAddress = (await contracts.createDeployMessage({
        package: helloPackage,
        constructorParams: {},
        keyPair: helloKeys,
    })).address;

    // TODO: Remove this guard when node se will work like a regular node
    if (nodeSe) {
        return;
    }

    try {
        await contracts.deploy({
            package: helloPackage,
            constructorParams: {},
            keyPair: helloKeys,
        });
        fail('error expected');
    } catch (error) {
        expect(error)
            .toMatchObject({
                code: TONErrorCode.ACCOUNT_MISSING,
            });
    }

    await tests.get_grams_from_giver(helloAddress, 100);

    try {
        await contracts.deploy({
            package: helloPackage,
            constructorParams: {},
            keyPair: helloKeys,
        });
        fail('error expected');
    } catch (error) {
        expect(error)
            .toMatchObject({
                code: TONErrorCode.ACCOUNT_BALANCE_TOO_LOW,
                data: {
                    original_error: {
                        code: abiVersion === 1
                            ? TONErrorCode.TRANSACTION_WAIT_TIMEOUT
                            : TONErrorCode.MESSAGE_EXPIRED,
                    },
                },
            });
    }

    helloKeys = await crypto.ed25519Keypair();
    helloAddress = (await contracts.createDeployMessage({
        package: helloPackage,
        constructorParams: {},
        keyPair: helloKeys,
    })).address;


    try {
        await contracts.run({
            address: helloAddress,
            abi: helloPackage.abi,
            functionName: 'touch',
            input: {},
            keyPair: helloKeys,
        });
        fail('error expected');
    } catch (error) {
        expect(error)
            .toMatchObject({
                code: TONErrorCode.ACCOUNT_MISSING,
            });
    }

    await tests.get_grams_from_giver(helloAddress, 100);

    try {
        await contracts.run({
            address: helloAddress,
            abi: helloPackage.abi,
            functionName: 'touch',
            input: {},
            keyPair: helloKeys,
        });
        fail('error expected');
    } catch (error) {
        expect(error)
            .toMatchObject({
                code: TONErrorCode.ACCOUNT_BALANCE_TOO_LOW,
                data: {
                    original_error: {
                        code: abiVersion === 1
                            ? TONErrorCode.TRANSACTION_WAIT_TIMEOUT
                            : TONErrorCode.MESSAGE_EXPIRED,
                    },
                },
            });
    }

    await tests.get_grams_from_giver(helloAddress, 1000000000);

    try {
        await contracts.run({
            address: helloAddress,
            abi: helloPackage.abi,
            functionName: 'touch',
            input: {},
            keyPair: helloKeys,
        });
        fail('error expected');
    } catch (error) {
        expect(error)
            .toMatchObject({
                code: TONErrorCode.ACCOUNT_CODE_MISSING,
                data: {
                    original_error: {
                        code: abiVersion === 1
                            ? TONErrorCode.TRANSACTION_WAIT_TIMEOUT
                            : TONErrorCode.MESSAGE_EXPIRED,
                    },
                },
            });
    }
});

test.each(ABIVersions)('runGet & runLocal errors (ABI %i)', async (abiVersion) => {
    const { contracts, crypto } = tests.client;
    const saveTimeout = tests.client.config.data.waitForTimeout;
    tests.client.config.data.waitForTimeout = 5000;
    const helloPackage = HelloContractPackage[abiVersion];

    const helloKeys = await crypto.ed25519Keypair();
    const helloAddress = (await contracts.createDeployMessage({
        package: helloPackage,
        constructorParams: {},
        keyPair: helloKeys,
    })).address;

    try {
        await contracts.runGet({
            address: helloAddress,
            functionName: 'foo',
        });
        fail('error expected');
    } catch (error) {
        expect(error)
            .toMatchObject({
                code: TONErrorCode.ACCOUNT_MISSING,
            });
    }

    try {
        await contracts.runLocal({
            address: helloAddress,
            functionName: 'foo',
            abi: helloPackage.abi,
            input: {},
        });
        fail('error expected');
    } catch (error) {
        expect(error)
            .toMatchObject({
                code: TONErrorCode.ACCOUNT_MISSING,
            });
    }

    tests.client.config.data.waitForTimeout = saveTimeout;
    await tests.get_grams_from_giver(helloAddress);
    tests.client.config.data.waitForTimeout = 5000;

    try {
        await contracts.runGet({
            address: helloAddress,
            functionName: 'foo',
        });
        fail('error expected');
    } catch (error) {
        expect(error)
            .toMatchObject({
                code: TONErrorCode.ACCOUNT_CODE_MISSING,
            });
    }

    try {
        await contracts.runLocal({
            address: helloAddress,
            functionName: 'foo',
            abi: helloPackage.abi,
            input: {},
        });
        fail('error expected');
    } catch (error) {
        expect(error)
            .toMatchObject({
                code: TONErrorCode.ACCOUNT_CODE_MISSING,
            });
    }
    tests.client.config.data.waitForTimeout = saveTimeout;
});

test.each(ABIVersions)('Test SDK Errors 1-3 (ABI v%i)', async (abiVersion) => {
    const { contracts, crypto } = tests.client;
    const walletPackage = WalletContractPackage[abiVersion];
    const keys = await crypto.ed25519Keypair();

    /* // TODO fix thrown TypeError: Cannot read property 'abi' of null && undefined
     try {
         await contracts.createDeployMessage({
             package: null,
             constructorParams: {},
             keyPair: keys,
         });
     } catch (error) {
         console.log(error);
          expect(error.source).toEqual('client');
          expect(error.code).toEqual(2);
     }
    try {
        await contracts.createDeployMessage({
            package: undefined,
            constructorParams: {},
            keyPair: keys,
        });
    } catch (error) {
        console.log(error);
        expect(error.source)
            .toEqual('client');
        expect(error.code)
            .toEqual(2);
    }

    try {
        await contracts.createDeployMessage({
            //$FlowFixMe
            package: 'wrongPackage',
            constructorParams: {},
            keyPair: keys,
        });
    } catch (error) {
        console.log(JSON.stringify(error));
        expect(error.source)
            .toEqual('client');
        expect(error.code)
            .toEqual(2);
        expect(error.data)
            .toBeNull();
        expect(error.message)
            .toMatch('Invalid params: missing field \`abi\`');
    } */

    await expectError(
        2,
        'client',
        'Invalid parameters: invalid type: null, expected struct KeyPair',
        async () => {
            await contracts.createDeployMessage({
                package: walletPackage,
                constructorParams: {},
                // $FlowFixMe
                keyPair: null,
            });
        },
    );

    await expectError(2, 'client', 'Invalid parameters: missing field `public`', async () => {
        await contracts.createDeployMessage({
            package: walletPackage,
            constructorParams: {},
            // $FlowFixMe
            keyPair: {},
        });
    });

    await expectError(2, 'client', 'invalid type: string "", expected struct KeyPair', async () => {
        await contracts.createDeployMessage({
            package: walletPackage,
            constructorParams: {},
            // $FlowFixMe
            keyPair: '',
        });
    });

    await expectError(
        1009,
        'client',
        'Address required for run local. You haven\'t specified contract code or data so address is required to load missing parts from network.',
        async () => {
            await contracts.runGet({
                codeBase64: '',
                functionName: 'participant_list',
            });
        },
    );
});
const literallyJustDateNow = () => Date.now();

test('Test SDK Error 1013', async () => {
    if (nodeSe) {
        return;
    }
    const { crypto, contracts } = await tests.createClient({});
    const helloKeys = await crypto.ed25519Keypair();
    const helloPackage = HelloContractPackage[2];

    const realDateNow = Date.now.bind(global.Date);
    const start = Date.now() - 20000;
    const dateNowStub = jest.fn(() => start);
    global.Date.now = dateNowStub;

    expect(literallyJustDateNow())
        .toBe(start);
    expect(dateNowStub)
        .toHaveBeenCalled();

    await expectError(
        1013,
        'client',
        'You local clock is out of sync with the server time. It is a critical condition for sending messages to the blockchain. Please sync you clock with the internet time',
        async () => {
            await contracts.run({
                address: "0:2222222222222222222222222222222222222222222222222222222222222222",
                abi: helloPackage.abi,
                functionName: 'touch',
                input: {},
                keyPair: helloKeys,
            });
        },
    );
    global.Date.now = realDateNow;
});

test.each(ABIVersions)('Test SDK Errors > 2000 (ABI v%i)', async (abiVersion) => {
    const { contracts, crypto } = tests.client;
    const walletPackage = WalletContractPackage[abiVersion];
    let wrongKeys = {
        public: '',
        secret: '6396991e831869ba7ca116767bdbceecc2d880146b34479a0063bdd8407fcc83',
    };
    try {
        await contracts.createDeployMessage({
            package: walletPackage,
            constructorParams: {},
            keyPair: wrongKeys,
        });
    } catch (error) {
        expect(error.source)
            .toEqual('client');
        expect(error.code)
            .toEqual(2001);
        expect(error.data)
            .toBeNull();
        expect(error.message)
            .toMatch('Invalid public key [PublicKey must be 32 bytes in length]');
    }


    wrongKeys = {
        public: '6396991e831869ba7ca116767bdbceecc2d880146b34479a0063bdd8407fcc83',
        secret: '',
    };
    try {
        await contracts.createDeployMessage({
            package: walletPackage,
            constructorParams: {},
            keyPair: wrongKeys,
        });
    } catch (error) {
        expect(error.source)
            .toEqual('client');
        expect(error.code)
            .toEqual(2002);
        expect(error.data)
            .toBeNull();
        expect(error.message)
            .toMatch('Invalid secret key [SecretKey must be 32 bytes in length]');
    }

    wrongKeys = {
        public: '/396991e831869ba7ca116767bdbceecc2d880146b34479a0063bdd8407fcc83',
        secret: '*396991e831869ba7ca116767bdbceecc2d880146b34479a0063bdd8407fcc83',
    };
    try {
        await contracts.createDeployMessage({
            package: walletPackage,
            constructorParams: {},
            keyPair: wrongKeys,
        });
    } catch (error) {
        expect(error.source)
            .toEqual('client');
        expect(error.code)
            .toEqual(2003);
        expect(error.data)
            .toBeNull();
        expect(error.message)
            .toMatch('Invalid key');
    }
    try {
        await crypto.factorize('');
    } catch (error) {
        expect(error.source)
            .toEqual('client');
        expect(error.code)
            .toEqual(2007);
        expect(error.data)
            .toBeNull();
        expect(error.message)
            .toMatch('Invalid factorize challenge: cannot parse integer from empty string');
    }
    try {
        await crypto.factorize('       ');
    } catch (error) {
        expect(error.source)
            .toEqual('client');
        expect(error.code)
            .toEqual(2007);
        expect(error.data)
            .toBeNull();
        expect(error.message)
            .toMatch('Invalid factorize challenge: invalid digit found in string');
    }
    try {
        await crypto.mnemonicFromEntropy({
            entropy: { hex: '' },
            dictionary: TONMnemonicDictionary.ENGLISH,
        });
    } catch (error) {
        expect(error.source)
            .toEqual('client');
        expect(error.code)
            .toEqual(2016);
        expect(error.data)
            .toBeNull();
        expect(error.message)
            .toMatch('Invalid bip39 entropy:');
    }

    await expectError(2017, 'client', 'Invalid bip39 phrase: one two', async () => {
        await crypto.mnemonicDeriveSignKeys({
            phrase: 'one two',
        });
    });

    await expectError(2017, 'client', 'Invalid bip39 phrase:', async () => {
        await crypto.mnemonicDeriveSignKeys({
            phrase: '',
        });
    });

    await expectError(2018, 'client', 'Invalid bip32 key: ', async () => {
        await crypto.hdkeyXPrvDerivePath('', '', true);
    });

    await expectError(2019, 'client', 'Invalid bip32 derive path:', async () => {
        await crypto.hdkeyXPrvDerivePath(
            'xprv9s21ZrQH143K25JhKqEwvJW7QAiVvkmi4WRenBZanA6kxHKtKAQQKwZG65kCyW5jWJ8NY9e3GkRoistUjjcpHNsGBUv94istDPXvqGNuWpC',
            'm/44\'/6   0\'/0\'/0\'',
            false,
        );
    });

    await expectError(2022, 'client', 'Invalid mnemonic dictionary', async () => {
        await crypto.mnemonicFromRandom({
            // $FlowFixMe
            dictionary: 255,
            wordCount: 12,
        });
    });

    for (const dict in TONMnemonicDictionary) {
        try {
            await crypto.mnemonicFromRandom({
                dictionary: TONMnemonicDictionary[dict],
                // $FlowFixMe
                wordCount: 1,
            });
        } catch (error) {
            if (TONMnemonicDictionary[dict] !== TONMnemonicDictionary.TON) {
                expect(error.source)
                    .toEqual('client');
                expect(error.code)
                    .toEqual(2023);
                expect(error.data)
                    .toBeNull();
                expect(error.message)
                    .toMatch('Invalid mnemonic word count');
            }
        }
    }
});

test.each(ABIVersions)('Test SDK Errors 3000-3020 (ABI v%i)', async (abiVersion) => {
    const { contracts } = tests.client;
    const walletPackage = WalletContractPackage[abiVersion];

    const keyPair = {
        public: '6396991e831869ba7ca116767bdbceecc2d880146b34479a0063bdd8407fcc83',
        secret: '6396991e831869ba7ca116767bdbceecc2d880146b34479a0063bdd8407fcc83',
    };
    await expectError(3002, 'client', 'Invalid contract image:', async () => {
        await contracts.createDeployMessage({
            package: {
                // $FlowFixMe
                abi: '',
                imageBase64: '#',
            },
            constructorParams: {},
            keyPair,
        });
    });
    await expectError(
        3003,
        'client',
        'Image creation failed: failed to fill whole buffer',
        async () => {
            await contracts.createDeployMessage({
                package: {
                    // $FlowFixMe
                    abi: '',
                    imageBase64: '',
                },
                constructorParams: {},
                keyPair,
            });
        },
    );

    const body = '';
    await expectError(3005, 'client', 'Decode run output failed:', async () => {
        await contracts.decodeOutputMessageBody({
            abi: walletPackage.abi,
            bodyBase64: body,
        });
    });
    await expectError(
        3006,
        'client',
        'Decode run input failed: failed to fill whole buffer',
        async () => {
            await contracts.decodeInputMessageBody({
                abi: walletPackage.abi,
                bodyBase64: body,
            });
        },
    );

    await expectError(
        3018,
        'client',
        'Local run failed: VM Exception: type check error',
        async () => {
            const ELECTOR_CODE = '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';
            const ELECTOR_DATA = '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';

            await contracts.runGet({
                codeBase64: ELECTOR_CODE,
                dataBase64: ELECTOR_DATA,
                input: '',
                functionName: 'get_past_complaints',
            });
        },
    );
});
