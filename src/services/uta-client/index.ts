/**
 * OpenAlpha-side adapter for the UTA service.
 *
 * `UTAManagerSDK` + `UTAAccountSDK` together replace the in-process
 * `UTAManager` + `UnifiedTradingAccount` that OpenAlpha instantiated in
 * `src/main.ts`. The public method shape is preserved (with all formerly-
 * sync methods returning Promises) so consumers — telegram-plugin, the
 * AI tool layer, trading-config — only need to add `await` to existing
 * callsites; they don't restructure.
 *
 * After Step 6 wires `src/main.ts` to construct `UTAManagerSDK` instead
 * of `UTAManager`, OpenAlpha no longer holds broker connections — UTA does.
 */

export * from './UTAManagerSDK.js'
export * from './UTAAccountSDK.js'
