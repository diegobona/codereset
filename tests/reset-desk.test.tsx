import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

    fireEvent.change(screen.getByLabelText("Paste Codex usage details"), {
      target: {
        value:
          "Weekly limit: 41% left · resets 2099-09-20T09:00:00Z\nSECRET-TEXT",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create countdown" }));
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

    fireEvent.change(screen.getByLabelText("Paste Codex usage details"), {
      target: {
        value: `5h limit: 73% left · resets 2099-09-15T18:30:00Z
Weekly limit: 41% left · resets 2099-09-20T09:00:00Z`,
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create countdown" }));

    expect(await screen.findByText("73%")).toBeInTheDocument();
    expect(screen.getByText("41%")).toBeInTheDocument();
    expect(screen.getAllByText("Resets in")).toHaveLength(2);
    expect(screen.queryByText("TIME TO RECOVERY")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Quota saved on this device");
  });

  it("shows account and model-specific CLI limits as separate quota cards", async () => {
    render(<ResetDesk />);

    fireEvent.change(screen.getByLabelText("Paste Codex usage details"), {
      target: {
        value: `Weekly limit: [████░░░░░░] 39% left (resets 17:04 on 19 Sep 2099)
GPT-5.3-Codex-Spark limit:
5h limit: [██████████] 100% left (resets 01:37 on 17 Sep 2099)
Weekly limit: [██████████] 100% left (resets 20:37 on 23 Sep 2099)`,
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create countdown" }));

    expect(await screen.findByText("Weekly quota")).toBeInTheDocument();
    expect(screen.getByText("GPT-5.3-Codex-Spark · 5-hour quota")).toBeInTheDocument();
    expect(screen.getByText("GPT-5.3-Codex-Spark · Weekly quota")).toBeInTheDocument();
    expect(screen.getByText("39%")).toBeInTheDocument();
    expect(screen.getAllByText("100%")).toHaveLength(2);
    expect(screen.getAllByText("Resets in")).toHaveLength(3);
  });

  it("turns a reset-only row copied from Codex Usage into a countdown", async () => {
    render(<ResetDesk />);

    fireEvent.change(screen.getByLabelText("Paste Codex usage details"), {
      target: {
        value: `每周使用限额
重置时间：2026年9月19日 17:04`,
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create countdown" }));

    expect(await screen.findByText("Weekly quota")).toBeInTheDocument();
    expect(screen.getByText("Resets in")).toBeInTheDocument();
    expect(screen.queryByText("Remaining")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Quota saved on this device");
  });

  it("reveals the countdown after parsing a copied one-line usage row", async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    render(<ResetDesk />);

    fireEvent.change(screen.getByLabelText("Paste Codex usage details"), {
      target: {
        value: "每周使用限额  重置时间：2026年9月19日  17:04  剩余  41%",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create countdown" }));

    expect(await screen.findByText("41%")).toBeInTheDocument();
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    }));
  });

  it("lets each quota window choose its own calendar reminder lead time", async () => {
    render(<ResetDesk />);

    fireEvent.change(screen.getByLabelText("Paste Codex usage details"), {
      target: {
        value: `5h limit: 73% left · resets 2099-09-15T18:30:00Z
Weekly limit: 41% left · resets 2099-09-20T09:00:00Z`,
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create countdown" }));

    const shortReminder = await screen.findByLabelText("5-hour reminder time");
    const weeklyReminder = screen.getByLabelText("weekly reminder time");

    expect(shortReminder).toHaveValue("5");
    expect(weeklyReminder).toHaveValue("5");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "5 min before",
      "15 min before",
      "30 min before",
      "5 min before",
      "15 min before",
      "30 min before",
    ]);

    fireEvent.change(shortReminder, { target: { value: "15" } });

    expect(shortReminder).toHaveValue("15");
    expect(weeklyReminder).toHaveValue("5");
    expect(screen.getByRole("button", { name: "Add 15-minute reminder" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add 5-minute reminder" }))
      .toBeInTheDocument();
  });

  it("uses a short prompt and does not render an empty result dashboard", () => {
    render(<ResetDesk />);

    expect(screen.getByPlaceholderText("Paste /status or Usage details"))
      .toHaveAccessibleDescription(
        "In Codex CLI, run /status and copy the quota lines. If no quota appears, copy a limit row from Settings → Usage.",
      );
    expect(screen.queryByText("WAITING FOR YOUR INPUT")).not.toBeInTheDocument();
    expect(screen.queryByText("— — : — — : — —")).not.toBeInTheDocument();
  });

  it("offers manual setup directly when parsing fails", () => {
    render(<ResetDesk />);

    fireEvent.change(screen.getByLabelText("Paste Codex usage details"), {
      target: { value: "not a quota status" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create countdown" }));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(
      "We couldn't find a quota name and reset time. Paste the quota lines from /status or Settings → Usage.",
    );
    fireEvent.click(within(alert).getByRole("button", { name: "Use manual setup" }));

    expect(screen.getByLabelText("5-hour remaining percentage")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("explains when Codex has not loaded limit data yet", () => {
    render(<ResetDesk />);

    fireEvent.change(screen.getByLabelText("Paste Codex usage details"), {
      target: { value: "Limits: data not available yet" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create countdown" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Codex has not loaded your limits yet. Wait a moment, then copy /status or Usage details again.",
    );
  });

  it("identifies a recognized window that is missing its reset time", () => {
    render(<ResetDesk />);

    fireEvent.change(screen.getByLabelText("Paste Codex usage details"), {
      target: { value: "5h limit: 73% left" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create countdown" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We found the quota, but not its reset time. Copy the full quota lines from /status or Settings → Usage.",
    );
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

    fireEvent.change(screen.getByLabelText("Paste Codex usage details"), {
      target: { value: "Weekly limit: 41% left · resets 2099-09-20T09:00:00Z" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create countdown" }));

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
    expect(screen.getByText(/weekly quota/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Paste Codex usage details")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update quota" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Update quota" }));

    expect(await screen.findByLabelText("Paste Codex usage details")).toBeInTheDocument();
  });

  it("keeps empty-state guidance compact and expandable", () => {
    render(<ResetDesk />);

    expect(screen.getByRole("heading", {
      level: 2,
      name: "Add your quota reset time",
    })).toBeInTheDocument();
    expect(screen.getByText("Where do I find this?")).toBeInTheDocument();
    const help = screen.getByText("Where do I find this?").closest("details");
    expect(help).toHaveTextContent("CLI: Run /status in Codex");
    expect(help).toHaveTextContent("App: Open Settings → Usage");
    expect(screen.queryByText("Nothing leaves this browser.")).not.toBeInTheDocument();
  });

  it("explains that an elapsed timer still needs to be checked in Codex", async () => {
    window.localStorage.setItem(
      "codereset:v1:quota",
      JSON.stringify({
        shortWindow: {
          remainingPercent: 73,
          resetAt: "2000-01-01T00:00:00.000Z",
        },
      }),
    );

    render(<ResetDesk />);

    expect(await screen.findByText("Reset time reached")).toBeInTheDocument();
    expect(screen.getByText("Reached")).toBeInTheDocument();
    expect(screen.getByText("Check your quota in Codex.")).toBeInTheDocument();
  });

  it("discards persisted windows with invalid runtime values", async () => {
    window.localStorage.setItem(
      "codereset:v1:quota",
      JSON.stringify({ weeklyWindow: { remainingPercent: 400, resetAt: "not-a-date" } }),
    );

    render(<ResetDesk />);

    expect(await screen.findByLabelText("Paste Codex usage details")).toBeInTheDocument();
    expect(screen.queryByText("WAITING FOR YOUR INPUT")).not.toBeInTheDocument();
  });

  it("keeps working when browser storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    render(<ResetDesk />);
    fireEvent.change(screen.getByLabelText("Paste Codex usage details"), {
      target: { value: "Weekly limit: 41% left · resets 2099-09-20T09:00:00Z" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create countdown" }));

    expect(await screen.findByText("41%")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("this tab only");
  });
});
