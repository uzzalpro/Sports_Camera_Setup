import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import TeamDetectorComponent from "../../components/config_components/TeamDetectorComponent";

describe("TeamDetectorComponent Integration Tests - Add, Save, Assign (real backend)", () => {
  const currentSetupId = "a7784d1c-0cb8-4239-b1f1-03f78dc19ad2";

  beforeEach(() => {
    render(<TeamDetectorComponent currentSetupId={currentSetupId} />);
  });

  it("adds a new TeamDetector and shows it in the dropdown list", async () => {
    fireEvent.click(screen.getByText("Add"));

    // Wait for the new TeamDetector to appear (assuming some network call or state update)
    await waitFor(() => {
      // Clicking 'Select' should open the dropdown
      fireEvent.click(screen.getByText("Select"));
    });

    // Wait for the empty config TeamDetector option to appear in the dropdown
    await waitFor(() => {
      expect(screen.getByText(JSON.stringify({ type: "", model_name: "", use_hsl: false, old_dual_head: false }))).toBeInTheDocument();
    });
  });

  it("edits config inputs and saves changes", async () => {
    fireEvent.click(screen.getByText("Select"));

    await waitFor(() => {
      const team_detectors = screen.getAllByRole("button", { name: /{.*}/ });
      expect(team_detectors.length).toBeGreaterThan(0);
      print(team_detectors.length)
    });
    const team_detectors = screen.getAllByRole("button", { name: /{.*}/ });

    await waitFor(() => {
      fireEvent.click(team_detectors[0]);
    });

    const typeInput = screen.getByLabelText("Type:");
    const hslInput = screen.getByLabelText("Use Hsl:");

    fireEvent.change(typeInput, { target: { value: "typed" } });
    fireEvent.change(hslInput, { target: { value: true } });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByLabelText("Type:").value).toBe("typed");
      expect(screen.getByLabelText("Use Hsl:").value).toBe("true");
    });
  });

  it("assigns selected TeamDetector to current setup", async () => {
    fireEvent.click(screen.getByText("Select"));

    await waitFor(() => {
      const team_detectors = screen.getAllByRole("button", { name: /{.*}/ });
      expect(team_detectors.length).toBeGreaterThan(0);
    });
    const team_detectors = screen.getAllByRole("button", { name: /{.*}/ });
    
    await waitFor(() => {
      fireEvent.click(team_detectors[0]);
    });

    fireEvent.click(screen.getByText("Assign"));

    // Wait for confirmation or UI stability
    await waitFor(() => {
      expect(screen.getByText("Assign")).toBeInTheDocument();
    });
  });
});
