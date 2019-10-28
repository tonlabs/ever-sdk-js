/*
 * Copyright 2018-2019 TON DEV SOLUTIONS LTD.
 *
 * Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
 * this file except in compliance with the License.  You may obtain a copy of the
 * License at:
 *
 * http://www.ton.dev/licenses
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific TON DEV software governing permissions and
 * limitations under the License.
 */

// @flow

import type { TONContractPackage } from '../src/modules/TONContractsModule';
import { TONOutputEncoding } from "../src/modules/TONCryptoModule";
import { WalletContractPackage } from './contracts/WalletContract';
import { tests, nodeSe } from "./init-tests";
import { SubscriptionContractPackage } from "./contracts/SubscriptionContract";

const nodeSeGiverAddress = 'a46af093b38fcae390e9af5104a93e22e82c29bcb35bf88160e4478417028884';
const nodeSeGiverAbi =
{
	"ABI version": 1,
	"functions": [
		{
			"name": "constructor",
			"inputs": [
			],
			"outputs": [
			]
		},
		{
			"name": "sendGrams",
			"inputs": [
				{"name":"dest","type":"uint256"},
				{"name":"amount","type":"uint64"}
			],
			"outputs": [
			]
		}
	],
	"events": [
	],
	"data": [
	]
};

const giverWalletAddressBase64 = 'UQC7oawjsBAYgInWIBDdsA1ZTADw4hd5Tz8rU6gYlOxxRrJ6';
const giverWalletAddressHex = 'BBA1AC23B010188089D62010DDB00D594C00F0E217794F3F2B53A81894EC7146';

const giverWalletKeys = {
    secret: '2245e4f44af8af6bbd15c4a53eb67a8f211d541ddc7c197f74d7830dba6d27fe',
    public: 'd542f44146f169c6726c8cf70e4cbb3d33d8d842a4afd799ac122c5808d81ba3',
};

const GiverWalletPackage = {
    abi: {
        "ABI version": 1,
        "functions": [
            {
                "name": "constructor",
                "inputs": [
                ],
                "outputs": [
                ]
            },
            {
                "name": "sendTransaction",
                "inputs": [
                    {"name":"dest","type":"uint256"},
                    {"name":"value","type":"uint128"},
                    {"name":"bounce","type":"bool"}
                ],
                "outputs": [
                ]
            },
            {
                "name": "setSubscriptionAccount",
                "inputs": [
                    {"name":"addr","type":"uint256"}
                ],
                "outputs": [
                ]
            },
            {
                "name": "getSubscriptionAccount",
                "inputs": [
                ],
                "outputs": [
                    {"name":"value0","type":"uint256"}
                ]
            }
        ],
        "events": [
        ],
        "data": [
        ]
    },
    imageBase64: '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',
};


async function check_giver() {
    const ton = tests.client;

    const deployMsg = await ton.contracts.createDeployMessage({
        package: GiverWalletPackage,
        constructorParams: {},
        keyPair: giverWalletKeys,
    });

    const accounts = await ton.queries.accounts.query({
        id: { eq: deployMsg.address }
    },
    `
        storage {
            balance { Grams }
            state {
                ...on AccountStorageStateAccountActiveVariant {
                    AccountActive { split_depth } 
                }
            }
        }
    `);

    if (accounts.length === 0) {
        throw "Giver wallet does not exist. Send some grams to " + giverWalletAddressBase64 + " (" + deployMsg.address + ")"
    }

    if (!(accounts[0]["storage"]["balance"]["Grams"]) ||
        parseInt(accounts[0]["storage"]["balance"]["Grams"], 10) < 500000000)
    {
        throw "Giver has no money. Send some grams to " + giverWalletAddressBase64 + " (" + deployMsg.address + ")"
    }

    if (!(accounts[0].storage.state.AccountActive)) {
        console.log('No giver. Deploy');

        await ton.contracts.deploy({
            package: GiverWalletPackage,
            constructorParams: {},
            keyPair: giverWalletKeys,
        });

        console.log('Giver deployed');
    }
}

export default async function get_grams_from_giver(account) {
    const { contracts, queries } = tests.client;

    if (nodeSe) {
        const result = await contracts.run({
            address: nodeSeGiverAddress,
            functionName: 'sendGrams',
            abi: nodeSeGiverAbi,
            input: {
                dest: `0x${account}`,
                amount: 500000000
            },
            keyPair: null,
        });
    } else {
        await check_giver();
        const result = await contracts.run({
            address: giverWalletAddressHex,
            functionName: 'sendTransaction',
            abi: GiverWalletPackage.abi,
            input: {
                dest: `0x${account}`,
                value: 500000000,
                bounce: false
            },
            keyPair: giverWalletKeys,
        });
    }


    const wait = await queries.accounts.waitFor(
        {
            id: { eq: account },
            storage: {
                balance: {
                    Grams: { gt: "0" }
                }
            }
        },
		'id storage {balance {Grams}}'
    );
};

export async function deploy_with_giver(params: TONContractDeployParams) {
    const { contracts } = tests.client;

    const message = await contracts.createDeployMessage(params);
    await get_grams_from_giver(message.address);
    return contracts.deploy(params);
}

beforeAll(tests.init);
afterAll(tests.done);

const walletKeys = {
    public: 'fb98b2541ba805648f25eb469dd4766fcdde03a2cfe6fb41d8c1571c29407ca3',
    secret: '7bfe77bbd3ad57ada9ed323da83504723e3af7cd3ba68b02d3c8335f75e0a24e',
};

const walletAddress = 'adb63a228837e478c7edf5fe3f0b5d12183e1f22246b67712b99ec538d6c5357';

test('load', async () => {
    const { contracts } = tests.client;
    const contract = await contracts.load({
        address: '0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF',
        includeImage: false,
    });
    expect(contract.id).toBeNull();
    expect(contract.balanceGrams).toBeNull();

    await get_grams_from_giver(walletAddress);

    const w = await contracts.load({
        address: walletAddress,
        includeImage: false,
    });
    expect(w.id).toEqual(walletAddress);
    expect(Number.parseInt(w.balanceGrams)).toBeGreaterThan(0);
});

test('deploy_new', async () => {
    const { contracts, crypto } = tests.client;
    const keys = await crypto.ed25519Keypair();

    await deploy_with_giver({
        package: WalletContractPackage,
        constructorParams: {},
        keyPair: keys,
    });
});
/*
test('run', async () => {
    const { contracts } = tests.client;
    const result = await contracts.run({
        address: walletAddress,
        functionName: 'getVersion',
        abi: WalletContractPackage.abi,
        input: {},
        keyPair: walletKeys,
    });
    expect(JSON.stringify(result)).toEqual(`{"output":{"error":"-0x1","version":{"major":"0x0","minor":"0x1"}}}`);
});
*/
test('decodeInputMessageBody', async () => {
    const { contracts } = tests.client;
    const body = 'te6ccgEBAgEAkQABWD/BEboAAAFt31a11CIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiAQDAVgroxdPfNhBVJLYXeA07DKQvKrlQ1qbP5gjuxdwkMO4hgjdYoA70MvP4p0RbEaOFzcdK1P8hBgssv0lBLMtjCPjvxPjSkA8JkCt/hjUCINRHrwCZtOYRLjk2PAdrwFpH';

    const result = await contracts.decodeInputMessageBody({
        abi: SubscriptionContractPackage.abi,
        bodyBase64: body
    });

    expect(result.function).toEqual('getSubscription');
    expect(result.output).toEqual({subscriptionId: "0x2222222222222222222222222222222222222222222222222222222222222222"});
});

const events_package: TONContractPackage = {
    abi: {
        "ABI version": 1,
        "functions": [
            {
                "name": "constructor",
                "inputs": [
                ],
                "outputs": [
                ]
            },
            {
                "name": "emitValue",
                "inputs": [
                    {"name":"id","type":"uint256"}
                ],
                "outputs": [
                ]
            },
            {
                "name": "returnValue",
                "inputs": [
                    {"name":"id","type":"uint256"}
                ],
                "outputs": [
                    {"name":"value0","type":"uint256"}
                ]
            }
        ],
        "events": [
            {
                "name": "EventThrown",
                "inputs": [
                    {"name":"id","type":"uint256"}
                ],
                "outputs": [
                ]
            }
        ],
        "data": [
        ]
    },
    imageBase64: "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"
};

test('filterOutput', async () => {
    const { contracts, crypto } = tests.client;
    const keys = await crypto.ed25519Keypair();

    const deployed = await deploy_with_giver({
        package: events_package,
        constructorParams: {},
        keyPair: keys,
    });

    const resultEmit = await contracts.run({
        address: deployed.address,
        functionName: 'emitValue',
        abi: events_package.abi,
        input: { id: "0" },
        keyPair: keys,
    });

    const resultReturn = await contracts.run({
        address: deployed.address,
        functionName: 'returnValue',
        abi: events_package.abi,
        input: { id: "0" },
        keyPair: keys,
    });
    expect(JSON.stringify(resultReturn)).toEqual(`{"output":{"value0":"0x0"}}`);
});

test('External Signing', async () => {
    const { contracts, crypto } = tests.client;
    const keys = await crypto.ed25519Keypair();
    
    var contract_package = events_package;
    contract_package.abi["setTime"] = false;

    const deployParams = {
        package: contract_package,
        constructorParams: {},
        keyPair: keys,
    };
    const unsignedMessage = await contracts.createUnsignedDeployMessage(deployParams);
    const signKey = await crypto.naclSignKeypairFromSecretKey(keys.secret);
    const signBytesBase64 = await crypto.naclSignDetached({
        base64: unsignedMessage.signParams.bytesToSignBase64,
    }, signKey.secret, TONOutputEncoding.Base64);
    const signed = await contracts.createSignedDeployMessage({
        address: unsignedMessage.address,
        createSignedParams: {
            publicKeyHex: keys.public,
            signBytesBase64: signBytesBase64,
            unsignedBytesBase64: unsignedMessage.signParams.unsignedBytesBase64,
        }
    });

    const message = await contracts.createDeployMessage(deployParams);
    expect(signed.message.messageBodyBase64).toEqual(message.message.messageBodyBase64);
});

test('changeInitState', async () => {
    const { contracts, crypto } = tests.client;
    const keys = await crypto.ed25519Keypair();

    const subscriptionAddess1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const subscriptionAddess2 = '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';

    const deployed1 = await deploy_with_giver({
        package: WalletContractPackage,
        constructorParams: {},
        initParams: { subscription: subscriptionAddess1 },
        keyPair: keys,
    });

    const deployed2 = await deploy_with_giver({
        package: WalletContractPackage,
        constructorParams: {},
        initParams: { subscription: subscriptionAddess2 },
        keyPair: keys,
    });

    expect(deployed1.address).not.toEqual(deployed2.address);

    const result1 = await contracts.run({
        address: deployed1.address,
        functionName: 'getSubscriptionAccount',
        abi: WalletContractPackage.abi,
        input: { },
        keyPair: keys,
    });

    const result2 = await contracts.run({
        address: deployed2.address,
        functionName: 'getSubscriptionAccount',
        abi: WalletContractPackage.abi,
        input: { },
        keyPair: keys,
    });

    expect(result1).toEqual({output: { value0: subscriptionAddess1 }});
    expect(result2).toEqual({output: { value0: subscriptionAddess2 }});
});

const setCode1_package: TONContractPackage = {
    abi: {
        "ABI version": 1,
        "functions": [
            {
                "name": "main",
                "inputs": [
                    {"name":"newcode","type":"cell"}
                ],
                "outputs": [
                    {"name":"value0","type":"uint256"}
                ]
            },
            {
                "name": "getVersion",
                "inputs": [
                ],
                "outputs": [
                    {"name":"value0","type":"uint256"}
                ]
            },
            {
                "name": "constructor",
                "inputs": [
                ],
                "outputs": [
                ]
            }
        ],
        "events": [
        ],
        "data": [
        ]
    } ,
    imageBase64: "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"
};

const setCode2_imageBase64 = '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';


test('testSetCode', async () => {
    const { contracts, crypto } = tests.client;
    const keys = await crypto.ed25519Keypair();

    const deployed = await deploy_with_giver({
        package: setCode1_package,
        constructorParams: {},
        keyPair: keys,
    });

    const version1 = await contracts.run({
        address: deployed.address,
        functionName: 'getVersion',
        abi: setCode1_package.abi,
        input: { },
        keyPair: keys,
    });

    const code = await contracts.getCodeFromImage({
        imageBase64: setCode2_imageBase64
    });

    const result = await contracts.run({
        address: deployed.address,
        functionName: 'main',
        abi: setCode1_package.abi,
        input: { newcode: code.codeBase64 },
        keyPair: keys,
    });

    const version2 = await contracts.run({
        address: deployed.address,
        functionName: 'getVersion',
        abi: setCode1_package.abi,
        input: { },
        keyPair: keys,
    });

    expect(version1).not.toEqual(version2);
});

test('testRunBody', async () => {
    const { contracts, crypto } = tests.client;

    const walletAddress = '0x2222222222222222222222222222222222222222222222222222222222222222';

    const result = await contracts.createRunBody({
        abi: SubscriptionContractPackage.abi,
        function: "constructor",
        params: {wallet: walletAddress},
        keyPair: walletKeys,
    });

    const parseResult = await contracts.decodeInputMessageBody({
        abi: SubscriptionContractPackage.abi,
        bodyBase64: result.bodyBase64,
    });

    expect(parseResult.function).toEqual('constructor');
    expect(parseResult.output).toEqual({wallet: walletAddress});

    const resultInternal = await contracts.createRunBody({
        abi: SubscriptionContractPackage.abi,
        function: "constructor",
        params: {wallet: walletAddress},
        internal: true,
    });

    const parseResultInternal = await contracts.decodeInputMessageBody({
        abi: SubscriptionContractPackage.abi,
        bodyBase64: resultInternal.bodyBase64,
        internal: true,
    });

    expect(parseResultInternal.function).toEqual('constructor');
    expect(parseResultInternal.output).toEqual({wallet: walletAddress});
});
