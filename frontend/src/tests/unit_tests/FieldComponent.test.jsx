import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FieldComponent from "../../components/config_components/FieldComponent";
import axios from "axios";

vi.mock("axios");

describe("FieldComponent", () => {
  const mockFieldList = [
    { id: "100", config: { pitch_width: 50, pitch_height: 100, left_top_x: 0, left_top_y: 0, right_bottom_x: 50, right_bottom_y: 100 } },
    { id: "101", config: { pitch_width: 60, pitch_height: 120, left_top_x: 5, left_top_y: 5, right_bottom_x: 65, right_bottom_y: 125 } }
  ];

  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: mockFieldList });

    render(<FieldComponent currentSetupId={789} />);

    await waitFor(() => {
      expect(screen.getByText("Field Configuration")).toBeInTheDocument();
    });
  });

  it("renders the field list after load", () => {
    fireEvent.click(screen.getByText("Select"));
    mockFieldList.forEach(field => {
      expect(screen.getByText(JSON.stringify(field.config))).toBeInTheDocument();
    });
  });

  it("adds a new field to the list", async () => {
    axios.post.mockResolvedValue({ data: "102" });

    fireEvent.click(screen.getByText("Add"));

    await waitFor(() => {
      fireEvent.click(screen.getByText("Select"));
      expect(screen.getByText(JSON.stringify({
        pitch_width: 0,
        pitch_height: 0,
        left_top_x: 0,
        left_top_y: 0,
        right_bottom_x: 0,
        right_bottom_y: 0
      }))).toBeInTheDocument();
    });
  });

  it("selects a field and displays input fields", () => {
    fireEvent.click(screen.getByText("Select"));
    fireEvent.click(screen.getByText(JSON.stringify(mockFieldList[0].config)));

    Object.entries(mockFieldList[0].config).forEach(([key, value]) => {
      const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ":";
      expect(screen.getByLabelText(label)).toBeInTheDocument();
      expect(screen.getByLabelText(label).value).toBe(String(value));
    });
  });

  it("updates input fields and sends updated config", async () => {
    fireEvent.click(screen.getByText("Select"));
    fireEvent.click(screen.getByText(JSON.stringify(mockFieldList[1].config)));

    const pitchWidthInput = screen.getByLabelText("Pitch Width:");
    fireEvent.change(pitchWidthInput, { target: { value: "70" } });
    expect(pitchWidthInput.value).toBe("70");

    axios.patch.mockResolvedValue({});
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining("/api/field/101"),
        expect.objectContaining({
          pitch_width: "70"  // Note: inputs always produce strings in React, so this is expected
        })
      );
    });
  });

  it("assigns selected field to setup", async () => {
    fireEvent.click(screen.getByText("Select"));
    fireEvent.click(screen.getByText(JSON.stringify(mockFieldList[0].config)));

    axios.patch.mockResolvedValue({});
    fireEvent.click(screen.getByText("Assign"));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining("/api/setup/789"),
        {},
        { params: { field_id: "100" } }
      );
    });
  });
});
