import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResetDesk } from "@/components/reset-desk";

describe("ResetDesk", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("records only coarse funnel events when pasted status parses", async () => {
    const payloads: string[] = [];
    Object.defineProperty(window.navigator, "sendBeacon", {
      configurable: true,
      value: vi.fn((_url: string, blob: Blob) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => payloads.push(String(reader.result)));
        reader.readAsText(blob);
        return true;
      }),
    });
    render(<ResetDesk />);

    fireEvent.change(screen.getByLabelText("Paste Codex status"), {
      target: {
        value:
          "Weekly limit: 41% left · resets 2099-09-20T09:00:00Z\nSECRET-TEXT",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Parse status" }));
    await waitFor(() => expect(payloads).toHaveLength(4));

    expect(payloads.map((payload) => JSON.parse(payload).event)).toEqual([
      "desk_start",
      "parser_attempt",
      "parser_success",
      "desk_complete",
    ]);
    expect(payloads.join(" ")).not.toContain("SECRET-TEXT");
    expect(payloads.map((payload) => JSON.parse(payload))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ page: "home" }),
      ]),
    );
  });

  it("parses pasted status into two visible quota windows", async () => {
    render(<ResetDesk />);

    fireEvent.change(screen.getByLabelText("Paste Codex status"), {
      target: {
        value: `5h limit: 73% left · resets 2099-09-15T18:30:00Z
Weekly limit: 41% left · resets 2099-09-20T09:00:00Z`,
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Parse status" }));

    expect(await screen.findByText("73%")).toBeInTheDocument();
    expect(screen.getByText("41%")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Saved on this device");
  });

  it("accepts a manual five-hour window", async () => {
    render(<ResetDesk />);

    fireEvent.click(screen.getByRole("button", { name: "Manual setup" }));
    fireEvent.change(screen.getByLabelText("5-hour remaining percentage"), {
      target: { value: "64" },
    });
    fireEvent.change(screen.getByLabelText("5-hour reset time"), {
      target: { value: "2099-09-15T18:30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save manual setup" }));

    expect(await screen.findByText("64%")).toBeInTheDocument();
  });

  it("persists parsed windows in local storage", async () => {
    render(<ResetDesk />);

    fireEvent.change(screen.getByLabelText("Paste Codex status"), {
      target: { value: "Weekly limit: 41% left · resets 2099-09-20T09:00:00Z" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Parse status" }));

    await waitFor(() => {
      expect(window.localStorage.getItem("codereset:v1:quota")).toContain("41");
    });
  });

  it("rehydrates a saved weekly window after reload", async () => {
    window.localStorage.setItem(
      "codereset:v1:quota",
      JSON.stringify({
        weeklyWindow: {
          remainingPercent: 38,
          resetAt: "2099-09-20T09:00:00.000Z",
        },
      }),
    );

    render(<ResetDesk />);

    expect(await screen.findByText("38%")).toBeInTheDocument();
    expect(screen.getByText(/weekly reset/i)).toBeInTheDocument();
  });

  it("discards persisted windows with invalid runtime values", async () => {
    window.localStorage.setItem(
      "codereset:v1:quota",
      JSON.stringify({ weeklyWindow: { remainingPercent: 400, resetAt: "not-a-date" } }),
    );

    render(<ResetDesk />);

    expect(await screen.findByText("WAITING FOR YOUR INPUT")).toBeInTheDocument();
  });

  it("keeps working when browser storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    render(<ResetDesk />);
    fireEvent.change(screen.getByLabelText("Paste Codex status"), {
      target: { value: "Weekly limit: 41% left · resets 2099-09-20T09:00:00Z" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Parse status" }));

    expect(await screen.findByText("41%")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("this tab only");
  });
});
