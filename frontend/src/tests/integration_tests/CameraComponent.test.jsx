import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import CameraComponent from "../../components/CameraComponent";

describe("CameraComponent Integration Tests - Add, Rename, Delete (real backend)", () => {
  const currentSetupId = "a7784d1c-0cb8-4239-b1f1-03f78dc19ad2"; // Replace with valid setup ID
  let cameraName = "New Camera"
  let updatedName = cameraName + "_Renamed";

  beforeEach(() => {
    render(<CameraComponent currentSetupId={currentSetupId} setCurrentCamera={() => {}} />);
  });

  it("adds a new camera and shows it in the dropdown", async () => {
    const input = screen.getByRole("textbox");
    
    fireEvent.change(input, { target: { value: cameraName } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }))
  });

  it("renames the newly added camera", async () => {
    fireEvent.click(screen.getByText("Choose Camera"));

    await waitFor(() => {
      const cameraOptions = screen.getAllByText(cameraName);
      expect(cameraOptions.length).toBeGreaterThan(0);
      fireEvent.click(cameraOptions[0]);  // Select only the first one
    });

    fireEvent.click(screen.getByText("Rename"));

    const renameInput = screen.getByDisplayValue(cameraName);
    fireEvent.change(renameInput, { target: { value: updatedName } });
    fireEvent.keyDown(renameInput, { key: "Enter", code: "Enter" });

    cameraName = updatedName; // Update for next test
  });

  it("deletes the renamed camera", async () => {
    fireEvent.click(screen.getByText("Choose Camera"));
    await waitFor(() => {
      const cameraOptions = screen.getAllByText(cameraName);
      expect(cameraOptions.length).toBeGreaterThan(0);
      fireEvent.click(cameraOptions[0]);  // Select only the first one
    });

    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      fireEvent.click(screen.getByText("Choose Camera"));
      const deleted = screen.queryByText(cameraName);
      expect(deleted).not.toBeInTheDocument();
    });
  });
});
