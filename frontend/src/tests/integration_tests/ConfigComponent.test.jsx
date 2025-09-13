import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import ConfigComponent from "../../components/ConfigComponent";

const currentSetupId = "a7784d1c-0cb8-4239-b1f1-03f78dc19ad2"; // Replace with a valid UUID from your backend

describe("ConfigComponent integration with real backend", () => {
  beforeEach(() => {
    render(<ConfigComponent currentSetupId={currentSetupId} />);
  });

  it("renders input fields after fetching config", async () => {
    await waitFor(() => {
      expect(screen.getByLabelText(/device type/i)).toBeInTheDocument();
    });
  });

  it("updates config values and saves to backend", async () => {
    const deviceTypeInput = await screen.findByLabelText(/device type/i);
    const debugCheckbox = screen.getByLabelText(/debug visualize/i);

    const originalDeviceType = deviceTypeInput.value;
    const originalDebugVisualize = debugCheckbox.checked;

    // Change values
    fireEvent.change(deviceTypeInput, { target: { value: "Test Device Type" } });
    fireEvent.click(debugCheckbox);

    // Click Save
    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    // Wait for any async save operations to complete
    await waitFor(() => {
      // If your UI shows confirmation, assert here, otherwise just wait
    });

    // Cleanup: reset values to original
    fireEvent.change(deviceTypeInput, { target: { value: originalDeviceType } });
    if (debugCheckbox.checked !== originalDebugVisualize) {
      fireEvent.click(debugCheckbox);
    }
    fireEvent.click(saveButton);

    await waitFor(() => {
      // Wait for reset save to finish if needed
    });
  });
});
