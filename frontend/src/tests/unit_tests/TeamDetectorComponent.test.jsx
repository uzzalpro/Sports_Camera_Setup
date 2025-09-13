import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TeamDetectorComponent from "../../components/config_components/TeamDetectorComponent";
import axios from "axios";

vi.mock("axios");

describe("TeamDetectorComponent", () => {
  const mockTeamDetectorList = [
    { id: "10", config: { type: "color", model_name: "ModelA", use_hsl: true, old_dual_head: false } },
    { id: "11", config: { type: "shape", model_name: "ModelB", use_hsl: false, old_dual_head: true } }
  ];

  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: mockTeamDetectorList });

    render(<TeamDetectorComponent currentSetupId={456} />);

    await waitFor(() => {
      expect(screen.getByText("Team Detector Configuration")).toBeInTheDocument();
    });
  });

  it("renders the team detector list after load", () => {
    fireEvent.click(screen.getByText("Select"));
    mockTeamDetectorList.forEach(td => {
      expect(screen.getByText(JSON.stringify(td.config))).toBeInTheDocument();
    });
  });

  it("adds a new team detector to the list", async () => {
    axios.post.mockResolvedValue({ data: "12" });

    fireEvent.click(screen.getByText("Add"));

    await waitFor(() => {
      fireEvent.click(screen.getByText("Select"));
      expect(screen.getByText(JSON.stringify({ type: "", model_name: "", use_hsl: false, old_dual_head: false }))).toBeInTheDocument();
    });
  });

  it("selects a team detector and displays input fields", () => {
    fireEvent.click(screen.getByText("Select"));
    fireEvent.click(screen.getByText(JSON.stringify(mockTeamDetectorList[0].config)));

    expect(screen.getByLabelText("Type:")).toBeInTheDocument();
    expect(screen.getByLabelText("Model Name:")).toBeInTheDocument();
    expect(screen.getByLabelText("Use Hsl:")).toBeInTheDocument();
    expect(screen.getByLabelText("Old Dual Head:")).toBeInTheDocument();

    expect(screen.getByLabelText("Type:").value).toBe("color");
    expect(screen.getByLabelText("Use Hsl:").checked).toBe(true);
  });

  it("updates input fields and sends updated config", async () => {
    fireEvent.click(screen.getByText("Select"));
    fireEvent.click(screen.getByText(JSON.stringify(mockTeamDetectorList[1].config)));

    const typeInput = screen.getByLabelText("Type:");
    fireEvent.change(typeInput, { target: { value: "pattern" } });
    expect(typeInput.value).toBe("pattern");

    const useHslCheckbox = screen.getByLabelText("Use Hsl:");
    fireEvent.click(useHslCheckbox);
    expect(useHslCheckbox.checked).toBe(true);

    axios.patch.mockResolvedValue({});
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining("/api/team-detector/11"),
        expect.objectContaining({
          type: "pattern",
          use_hsl: true
        })
      );
    });
  });

  it("assigns selected team detector to setup", async () => {
    fireEvent.click(screen.getByText("Select"));
    fireEvent.click(screen.getByText(JSON.stringify(mockTeamDetectorList[0].config)));

    axios.patch.mockResolvedValue({});
    fireEvent.click(screen.getByText("Assign"));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining("/api/setup/456"),
        {},
        { params: { team_detector_id: "10" } }
      );
    });
  });
});
