import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import HomeComponent from "../../components/HomeComponent";

// Mock axios globally
vi.mock("axios");

const mockProps = {
  setCurrentPage: vi.fn(),
  setCurrentSetup: vi.fn(),
  setCurrentSetupId: vi.fn(),
};

describe("HomeComponent", () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: [] });
    render(<HomeComponent {...mockProps} />);
  });

  it("renders correctly", () => {
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
    expect(screen.getByTestId("setup-list")).toBeInTheDocument();
  });

  it("adds a new setup when there's text in the inputfield and the Add button is clicked", async () => {
    axios.post.mockResolvedValueOnce({ data:1 }); // Mock POST success

    const input = screen.getByRole("textbox");
    const addButton = screen.getByRole("button", { name: /add/i });

    fireEvent.change(input, { target: { value: "Test Setup" } });
    fireEvent.click(addButton);


    // Wait for the POST call
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/setup"),
        { setup_name: "Test Setup" }
      );
    });

    // Optionally, check that input is cleared
    expect(input.value).toBe("");

    // New setup visible in list
    await waitFor(() => {
      expect(screen.getByText("Test Setup")).toBeInTheDocument();
    });
  });

  it("adds a new setup when there's text in the inputfield and the Enter key is pressed", async () => {
    axios.post.mockResolvedValueOnce({ data:1 }); // Mock POST success

    const input = screen.getByRole("textbox");
    const addButton = screen.getByRole("button", { name: /add/i });

    fireEvent.change(input, { target: { value: "Test Setup 2" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });


    // Wait for the POST call
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/setup"),
        { setup_name: "Test Setup 2" }
      );
    });

    // Optionally, check that input is cleared
    expect(input.value).toBe("");

    // New setup visible in list
    await waitFor(() => {
      expect(screen.getByText("Test Setup 2")).toBeInTheDocument();
    });
  });

  it("Adds a setup then renames it when there's text in the rename-inputfield and the Enter key is pressed", async () => {
    axios.post.mockResolvedValueOnce({ data:1 }); // Mock POST success

    const input = screen.getByRole("textbox");
    const addButton = screen.getByRole("button", { name: /add/i });

    fireEvent.change(input, { target: { value: "Test Setup 3" } });
    fireEvent.click(addButton);


    // Wait for the POST call
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/setup"),
        { setup_name: "Test Setup 3" }
      );
    });

    // Optionally, check that input is cleared
    expect(input.value).toBe("");

    // New setup visible in list
    await waitFor(() => {
      expect(screen.getByText("Test Setup 3")).toBeInTheDocument();
    });
    
    axios.patch.mockResolvedValueOnce({}); // Mock PATCH success

    // Click the Rename button next to the existing setup
    const renameButton = screen.getByRole("button", { name: "Rename" });
    fireEvent.click(renameButton);

    // Now the rename input should appear, find it by role textbox (input inside li)
    const renameInput = screen.getByTestId('rename-input-1');

    // Change the input value to the new name
    fireEvent.change(renameInput, { target: { value: "Renamed Setup" } });

    // Press Enter to confirm rename
    fireEvent.keyDown(renameInput, { key: "Enter", code: "Enter" });

    // Wait for PATCH call to happen
    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining("/api/setup/1"),
        {},
        { params: { setup_name: "Renamed Setup" } }
      );
    });

    // Check if the updated setup name appears in the list
    await waitFor(() => {
      expect(screen.getByText("Renamed Setup")).toBeInTheDocument();
    });

    // The rename input should disappear (back to Rename button)
    expect(screen.queryByDisplayValue("Renamed Setup")).not.toBeInTheDocument();
  });
});
