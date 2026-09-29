import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { createEditorStore } from "./store/editorStore";

vi.mock("@react-three/fiber", () => ({
  Canvas: () => <div data-testid="preview-canvas" />,
}));

vi.mock("@react-three/drei", () => ({
  OrbitControls: () => null,
}));

describe("editor workspace", () => {
  function renderApp() {
    const store = createEditorStore();
    render(<App store={store} />);
    return store;
  }

  it("renders the R15 joint tree, viewport placeholder, and inspector", () => {
    renderApp();

    expect(screen.getByText("Roblox Animator Desktop")).toBeInTheDocument();
    expect(screen.getByTestId("preview-canvas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Right Upper Arm" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Inspector" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Prepare export" })).toBeDisabled();
    expect(screen.getByRole("status", { name: "Bridge status" })).toHaveTextContent(
      "Bridge: unavailable",
    );
  });

  it("selects a joint and edits its canonical rotation through inspector fields", () => {
    const store = renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Right Upper Arm" }));
    expect(screen.getByText("Seleccionado: RightUpperArm")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("spinbutton", { name: "X Rotation" }), {
      target: { value: "45" },
    });

    expect(screen.getByRole("spinbutton", { name: "X Rotation" })).toHaveValue(45);
    expect(store.getState().isDirty).toBe(true);
  });

  it("switches between the approved R6 and R15 joint definitions", () => {
    const store = renderApp();

    fireEvent.change(screen.getByRole("combobox", { name: "Rig" }), {
      target: { value: "R6" },
    });

    expect(screen.getByRole("button", { name: "Right Arm" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Right Upper Arm" }),
    ).not.toBeInTheDocument();
    expect(store.getState().isDirty).toBe(true);
  });

  it("routes inspector edits through undo and redo and keeps frame selection clean", () => {
    const store = renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Right Upper Arm" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "X Rotation" }), {
      target: { value: "30" },
    });
    expect(screen.getByText(/Modificado \*/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByRole("spinbutton", { name: "X Rotation" })).toHaveValue(0);
    expect(store.getState().isDirty).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(screen.getByRole("spinbutton", { name: "X Rotation" })).toHaveValue(30);
    store.getState().markSaved();

    fireEvent.change(screen.getByRole("spinbutton", { name: "Current frame" }), {
      target: { value: "16" },
    });
    expect(store.getState().currentFrame).toBe(16);
    expect(store.getState().isDirty).toBe(false);
  });
});
