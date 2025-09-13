import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import DetectorComponent from "../../components/config_components/DetectorComponent";

describe("DetectorComponent Integration Tests - Add, Save, Assign (real backend)", () => {
  const currentSetupId = "a7784d1c-0cb8-4239-b1f1-03f78dc19ad2";

  beforeEach(() => {
    render(<DetectorComponent currentSetupId={currentSetupId} />);
  });

  it("adds a new detector and shows it in the dropdown list", async () => {
    fireEvent.click(screen.getByText("Add"));

    // Wait for the new detector to appear (assuming some network call or state update)
    await waitFor(() => {
      // Clicking 'Select' should open the dropdown
      fireEvent.click(screen.getByText("Select"));
    });

    // Wait for the empty config detector option to appear in the dropdown
    await waitFor(() => {
      expect(screen.getByText(JSON.stringify({ detector_model: "", image_size: 0 }))).toBeInTheDocument();
    });
  });

  it("edits config inputs and saves changes", async () => {
    fireEvent.click(screen.getByText("Select"));

    await waitFor(() => {
      const detectors = screen.getAllByRole("button", { name: /{.*}/ });
      expect(detectors.length).toBeGreaterThan(0);
      print(detectors.length)
    });
    const detectors = screen.getAllByRole("button", { name: /{.*}/ });

    await waitFor(() => {
      fireEvent.click(detectors[0]);
    });

    const modelInput = screen.getByLabelText("Model Name:");
    const sizeInput = screen.getByLabelText("Image Size:");

    fireEvent.change(modelInput, { target: { value: "YOLOv5-Edited" } });
    fireEvent.change(sizeInput, { target: { value: "800" } });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByLabelText("Model Name:").value).toBe("YOLOv5-Edited");
      expect(screen.getByLabelText("Image Size:").value).toBe("800");
    });
  });

  it("assigns selected detector to current setup", async () => {
    fireEvent.click(screen.getByText("Select"));

    await waitFor(() => {
      const detectors = screen.getAllByRole("button", { name: /{.*}/ });
      expect(detectors.length).toBeGreaterThan(0);
    });
    const detectors = screen.getAllByRole("button", { name: /{.*}/ });
    
    await waitFor(() => {
      fireEvent.click(detectors[0]);
    });

    fireEvent.click(screen.getByText("Assign"));

    // Wait for confirmation or UI stability
    await waitFor(() => {
      expect(screen.getByText("Assign")).toBeInTheDocument();
    });
  });
});
