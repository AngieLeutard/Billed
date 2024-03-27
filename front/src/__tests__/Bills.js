/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import  Bills from "../containers/Bills.js";
import { formatDate, formatStatus } from "../app/format.js";
import userEvent from "@testing-library/user-event";

import router from "../app/Router.js";

const mockStore = {
  bills: () => ({
     list: jest.fn().mockResolvedValue([
       { id: '1', date: '2024-03-26', status: 'paid' },
       { id: '2', date: '2024-03-25', status: 'unpaid' },
     ]),
  }),
 };
 
 jest.mock('../app/format', () => ({
  formatDate: jest.fn((date) => date),
  formatStatus: jest.fn((status) => status.charAt(0).toUpperCase() + status.slice(1)),
 }));

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})

describe("Given I am connected as Employee on Bill page", () => {
	describe("When I click on an eye icon", () => {
		test("Then a modal should be open", () => {
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				})
			);
			document.body.innerHTML = BillsUI({ data: bills });
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};
			const store = null;
			const bill = new Bills({
				document,
				onNavigate,
				store,
				localStorage: window.localStorage,
			});

			const modale = document.getElementById("modaleFile");
			$.fn.modal = jest.fn(() => modale.classList.add("show"));

			const eye = screen.getAllByTestId("icon-eye")[0];
			const handleClickIconEye = jest.fn(bill.handleClickIconEye(eye));

			eye.addEventListener("click", handleClickIconEye);
			userEvent.click(eye);
			expect(handleClickIconEye).toHaveBeenCalled();

			expect(modale.classList).toContain("show");

			expect(screen.getByText("Justificatif")).toBeTruthy();
			expect(bills[0].fileUrl).toBeTruthy();
		});
	});
});

// test d'intégration GET

describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()

      window.onNavigate(ROUTES_PATH.Bills)

      await waitFor(() => screen.getByText("Mes notes de frais"))

      const amount  = await screen.getByText("Montant")
      expect(amount).toBeTruthy()

      const state  = await screen.getByText("Statut")
      expect(state).toBeTruthy()
    })
  })

  describe('getBills', () => {
    it('should fetch and format bills correctly', async () => {
       const root = document.createElement("div")
       root.setAttribute("id", "root")
       document.body.append(root)
   
       const instance = new Bills({ document: document, store: mockStore });
   
       const bills = await instance.getBills();
   
       expect(bills).toEqual([
         { id: '1', date: '2024-03-26', status: 'Paid' },
         { id: '2', date: '2024-03-25', status: 'Unpaid' },
       ]);
   
       expect(formatDate).toHaveBeenCalledTimes(2);
       expect(formatStatus).toHaveBeenCalledTimes(2);
    });
   
    it('should handle errors gracefully', async () => {
       const errorStore = {
         bills: () => ({
           list: jest.fn().mockRejectedValue(new Error('Failed to fetch bills')),
         }),
       };
   
       const root = document.createElement("div")
       root.setAttribute("id", "root")
       document.body.append(root)
   
       const instance = new Bills({ document: document, store: errorStore });
       await expect(instance.getBills()).rejects.toThrow('Failed to fetch bills');
    });
   });
})