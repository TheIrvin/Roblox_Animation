import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("@react-three/fiber", () => ({
  Canvas: () => <div data-testid="preview-canvas" />,
}));

vi.mock("@react-three/drei", () => ({
  OrbitControls: () => null,
}));

describe("editor workspace", () => {
  it("renders the R15 joint tree, viewport placeholder, and inspector", () => {
    render(<App />);

    expect(screen.getByText("Roblox Animator Desktop")).toBeInTheDocument();
    expect(screen.getByTestId("preview-canvas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Right Upper Arm" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Inspector" })).toBeInTheDocument();
  });

  it("selects a joint and edits its canonical rotation through inspector fields", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Right Upper Arm" }));
    expect(screen.getByText("Seleccionado: RightUpperArm")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("spinbutton", { name: "X Rotation" }), {
      target: { value: "45" },
    });

    expect(screen.getByRole("spinbutton", { name: "X Rotation" })).toHaveValue(45);
  });

  it("switches between the approved R6 and R15 joint definitions", () => {
    render(<App />);

    fireEvent.change(screen.getByRole("combobox", { name: "Rig" }), {
      target: { value: "R6" },
    });

    expect(screen.getByRole("button", { name: "Right Arm" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Right Upper Arm" }),
    ).not.toBeInTheDocument();
  });
});
