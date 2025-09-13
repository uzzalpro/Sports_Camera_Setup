// tests/unit/App.test.jsx
import { describe, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import App from "../../App"
import axios from "axios"

vi.mock("axios") // Mock axios globally

describe("App Component", () => {
  it("should render the Sidebar and Home page by default", async () => {
    axios.get.mockResolvedValue({ data: [] }) // Mock backend API call
    
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    )

    // Expect sidebar title
    expect(screen.getByText("TrackBox")).toBeInTheDocument()

    // Home page-specific text (from HomeComponent)
    expect(screen.getByText(/home/i)).toBeInTheDocument()
  })

  it("should navigate to Overview page", async () => {
    render(
      <MemoryRouter initialEntries={["/overview"]}>
        <App />
      </MemoryRouter>
    )

    // Expect OverviewComponent contents
    expect(screen.getByText(/overview/i)).toBeInTheDocument()
  })
})
