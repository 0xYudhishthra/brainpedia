/**
 * @brainpedia/brain — entry point for the Brain-side service.
 *
 * Exports the pure query handler so it can be wired behind any transport
 * (AXL MCP routing, raw HTTP, A2A, in-process). A standalone HTTP server
 * wrapper will land here once the AXL daemon's service-registration API
 * is verified against the live binary.
 */
export {
  createBrainHandler,
  type BrainOptions,
  type BrainQueryRequest,
  type BrainQueryResult,
} from './handler.js';
