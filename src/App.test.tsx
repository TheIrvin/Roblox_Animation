import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("@react-three/fiber", () => ({
  Canvas: () => <div data-testid="preview-canvas" />,
}));

vi.mock("@react-three/drei", () => ({
  OrbitControls: () => null,
}));

describe("bootstrap application", () => {
  it("renders the desktop workspace shell", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Un espacio claro para empezar a animar." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Roblox Animator Desktop")).toBeInTheDocument();
    expect(screen.getByText("Bootstrap ready")).toBeInTheDocument();
  });

  it("mounts a placeholder for the 3D renderer", () => {
    render(<App />);

    expect(screen.getByTestId("preview-canvas")).toBeInTheDocument();
  });
});
