import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import FieldComponent from "../../components/config_components/FieldComponent";

describe("FieldComponent Integration Tests - Add, Save, Assign (real backend)", () => {
  const currentSetupId = "a7784d1c-0cb8-4239-b1f1-03f78dc19ad2";

  beforeEach(() => {
    render(<FieldComponent currentSetupId={currentSetupId} />);
  });

  it("adds a new Field and shows it in the dropdown list", async () => {
    fireEvent.click(screen.getByText("Add"));

    // Wait for the new Field to appear (assuming some network call or state update)
    await waitFor(() => {
      // Clicking 'Select' should open the dropdown
      fireEvent.click(screen.getByText("Select"));
    });

    // Wait for the empty config Field option to appear in the dropdown
    await waitFor(() => {
      expect(screen.getByText(JSON.stringify({ pitch_width: 0, pitch_height: 0, left_top_x: 0, left_top_y: 0, right_bottom_x: 0, right_bottom_y: 0 }))).toBeInTheDocument();
    });
  });

  it("edits config inputs and saves changes", async () => {
    fireEvent.click(screen.getByText("Select"));

    await waitFor(() => {
      const fields = screen.getAllByRole("button", { name: /{.*}/ });
      expect(fields.length).toBeGreaterThan(0);
      print(fields.length)
    });
    const fields = screen.getAllByRole("button", { name: /{.*}/ });

    await waitFor(() => {
      fireEvent.click(fields[0]);
    });

    const widthInput = screen.getByLabelText("Pitch Width:");
    const heightInput = screen.getByLabelText("Pitch Height:");

    fireEvent.change(widthInput, { target: { value: 1920 } });
    fireEvent.change(heightInput, { target: { value: 1080 } });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByLabelText("Pitch Width:").value).toBe("1920");
      expect(screen.getByLabelText("Pitch Height:").value).toBe("1080");
    });
  });

  it("assigns selected Field to current setup", async () => {
    fireEvent.click(screen.getByText("Select"));

    await waitFor(() => {
      const fields = screen.getAllByRole("button", { name: /{.*}/ });
      expect(fields.length).toBeGreaterThan(0);
    });
    const fields = screen.getAllByRole("button", { name: /{.*}/ });
    
    await waitFor(() => {
      fireEvent.click(fields[0]);
    });

    fireEvent.click(screen.getByText("Assign"));

    // Wait for confirmation or UI stability
    await waitFor(() => {
      expect(screen.getByText("Assign")).toBeInTheDocument();
    });
  });
});
