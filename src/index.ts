import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Kappa Simulation Server",
		version: "1.0.0",
	});

	private readonly API_BASE = "https://kappa-async.livecode.ch";

	async init() {
		// Run Kappa simulation synchronously
		this.server.tool(
			"run",
			{
				ka: z.string().describe("Kappa code to simulate"),
				l: z.number().optional().default(100).describe("Simulation limit"),
				p: z.number().optional().default(1.0).describe("Plot period"),
			},
			async ({ ka, l, p }) => {
				try {
					const response = await fetch(`${this.API_BASE}/run`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ ka, l, p }),
					});

					if (!response.ok) {
						return {
							content: [
								{
									type: "text",
									text: `Error: HTTP ${response.status} - ${response.statusText}`,
								},
							],
						};
					}

					const result = await response.json();
					return {
						content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: `Error: ${error instanceof Error ? error.message : String(error)}`,
							},
						],
					};
				}
			},
		);

		// Run Kappa simulation asynchronously
		this.server.tool(
			"run_async",
			{
				ka: z.string().describe("Kappa code to simulate"),
				l: z.number().optional().default(100).describe("Simulation limit"),
				p: z.number().optional().default(1.0).describe("Plot period"),
			},
			async ({ ka, l, p }) => {
				try {
					const response = await fetch(`${this.API_BASE}/run_async`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ ka, l, p }),
					});

					if (!response.ok) {
						return {
							content: [
								{
									type: "text",
									text: `Error: HTTP ${response.status} - ${response.statusText}`,
								},
							],
						};
					}

					const result = await response.json();
					return {
						content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: `Error: ${error instanceof Error ? error.message : String(error)}`,
							},
						],
					};
				}
			},
		);

		// Get async simulation result
		this.server.tool(
			"run_async_result",
			{
				key: z.string().describe("Unique task identifier"),
			},
			async ({ key }) => {
				try {
					const response = await fetch(`${this.API_BASE}/run_async_result`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ key }),
					});

					const result = await response.json();

					if (response.status === 202) {
						return {
							content: [
								{
									type: "text",
									text: "Simulation still running. Please try again later.",
								},
							],
						};
					}

					if (response.status === 404) {
						return {
							content: [{ type: "text", text: "Task not found." }],
						};
					}

					if (!response.ok) {
						return {
							content: [
								{
									type: "text",
									text: `Error: HTTP ${response.status} - ${response.statusText}`,
								},
							],
						};
					}

					return {
						content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: `Error: ${error instanceof Error ? error.message : String(error)}`,
							},
						],
					};
				}
			},
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
