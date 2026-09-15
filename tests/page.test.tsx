import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("leads with a clear quota reset promise", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /know exactly when you can ship again/i }),
    ).toBeInTheDocument();
  });

  it("explains the private local tracking model", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /your quota stays on your device/i }),
    ).toBeInTheDocument();
  });

  it("distinguishes personal windows from public reset events", () => {
    render(<HomePage />);

    expect(screen.getByText("Your quota window", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("Public reset event", { exact: true })).toBeInTheDocument();
  });

  it("discloses that the product is independent", () => {
    render(<HomePage />);

    expect(screen.getByText(/not affiliated with openai/i)).toBeInTheDocument();
  });
});
