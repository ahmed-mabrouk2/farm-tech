/**
 * Frontend API Client Tests
 *
 * Uses Node.js built-in test runner (node:test) — no jest required.
 * Run with:  node --experimental-test-snapshots --loader ts-node/esm __tests__/api.test.ts
 * Or simply: npm test
 */

import { describe, it, before, afterEach } from "node:test"
import assert from "node:assert/strict"

// ─── Types ────────────────────────────────────────────────────────────────────

type FetchResponse = {
  ok: boolean
  status: number
  json: () => Promise<unknown>
}

// ─── Minimal fetch mock ───────────────────────────────────────────────────────

let _mockedFetch: ((input: RequestInfo | URL, init?: RequestInit) => Promise<FetchResponse>) | null = null
const originalFetch = globalThis.fetch

function mockFetch(ok: boolean, data: unknown, status = 200): void {
  _mockedFetch = () =>
    Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(data),
    })
  ;(globalThis as unknown as Record<string, unknown>).fetch = _mockedFetch
}

function resetFetch(): void {
  _mockedFetch = null
  ;(globalThis as unknown as Record<string, unknown>).fetch = originalFetch
}

// ─── Import API helpers ────────────────────────────────────────────────────────

import {
  analyzeIrrigation,
  fetchForecast,
  fetchCommodities,
  fetchYieldPrediction,
} from "../lib/api"

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("fetchForecast", () => {
  afterEach(resetFetch)

  it("parses forecast array on success", async () => {
    mockFetch(true, {
      success: true,
      commodity: "Wheat",
      forecast: [
        { commodity: "Wheat", year: 2026, quarter: 1, price: 16000 },
        { commodity: "Wheat", year: 2026, quarter: 2, price: 16200 },
      ],
    })

    const result = await fetchForecast("Wheat")
    assert.equal(result.length, 2)
    assert.equal(result[0].price, 16000)
    assert.equal(result[1].quarter, 2)
  })

  it("throws on HTTP error status", async () => {
    mockFetch(false, {}, 500)
    await assert.rejects(() => fetchForecast("Wheat"))
  })
})

describe("fetchCommodities", () => {
  afterEach(resetFetch)

  it("returns commodity list on success", async () => {
    mockFetch(true, { success: true, commodities: ["Wheat", "Rice", "Tomato"] })
    const result = await fetchCommodities()
    assert.deepEqual(result, ["Wheat", "Rice", "Tomato"])
  })

  it("returns empty array on failure", async () => {
    mockFetch(false, {}, 500)
    const result = await fetchCommodities()
    assert.deepEqual(result, [])
  })
})

describe("analyzeIrrigation", () => {
  afterEach(resetFetch)

  it("returns recommendation on success", async () => {
    mockFetch(true, {
      success: true,
      data: {
        irrigation_need_mm_season: 35.5,
        irrigation_class: "Moderate Irrigation Required",
      },
    })

    const result = await analyzeIrrigation({ lat: 30, lon: 31, crop: "wheat" })
    assert.equal(result.irrigation_need_mm_season, 35.5)
    assert.ok(result.irrigation_class.includes("Moderate"))
  })

  it("throws on API error", async () => {
    mockFetch(false, { error: "Invalid coordinates" }, 400)
    await assert.rejects(() => analyzeIrrigation({ lat: 999, lon: 999, crop: "wheat" }))
  })
})

describe("fetchYieldPrediction", () => {
  afterEach(resetFetch)

  it("returns yield value on success", async () => {
    mockFetch(true, {
      success: true,
      data: { crop: "wheat", yield_value: 6.8, unit: "Tons/Ha", source: "AI model" },
    })

    const result = await fetchYieldPrediction(30, 31, 2026, "wheat")
    assert.equal(result.yield_value, 6.8)
    assert.equal(result.source, "AI model")
  })

  it("throws on HTTP error", async () => {
    mockFetch(false, {}, 500)
    await assert.rejects(() => fetchYieldPrediction(30, 31, 2026, "wheat"))
  })
})
