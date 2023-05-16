import { TonClient } from "@eversdk/core"
import { Account } from "@eversdk/appkit"
import { Giver, DEFAULT_TOPUP_BALANCE } from "./giver"
import { getDefaultEndpoints } from "./utils"
import * as Touch from "./contracts/Touch.js"

export const DEFAULT_TOUCH_MAX_BALANCE = 100 * 1e9

export async function touch(options: { value: number }) {
    const sdk = new TonClient({
        abi: {
            message_expiration_timeout: 120_000,
            message_expiration_timeout_grow_factor: 1,
        },
        network: {
            endpoints: getDefaultEndpoints(),
            message_retries_count: 2,
        },
    })
    try {
        const giver = await Giver.create(sdk)
        const touch = new Account(Touch, {
            client: sdk,
            signer: giver.account.signer,
        })
        const touchAccount = await touch.getAccount()
        const { balance } = touchAccount
        const address = await touch.getAddress()

        if (BigInt(balance ?? 0) < DEFAULT_TOPUP_BALANCE) {
            await giver.sendTo(address, options.value)
            console.log("Touch topup:", address)
        }

        if (touchAccount.acc_type != 1) {
            const deploy = await touch.deploy({
                initFunctionName: "constructor",
                initInput: {},
            })
            console.log("Touch deploy:", deploy.transaction.id)
        } else {
            const timestampOld = BigInt(
                (await touch.runLocal("getTimestamp", {})).decoded?.output
                    .value0 ?? 0,
            )
            const balanceBefore = BigInt((await touch.getBalance()) ?? 0)

            const response = await touch.run("touch", {})
            touch.refresh()

            const timestampNew = BigInt(
                (await touch.runLocal("getTimestamp", {})).decoded?.output
                    .value0 ?? 0,
            )
            const balanceAfter = BigInt((await touch.getBalance()) ?? 0)

            if (timestampNew > timestampOld) {
                console.log(
                    `Touch ok: ${
                        response.transaction.id
                    }\nTouch balance: ${balanceAfter} cost: ${
                        balanceBefore - balanceAfter
                    }`,
                )
            } else {
                throw Error(`Touch ${response.transaction.id}`)
            }
        }
    } finally {
        sdk.close()
    }
}
