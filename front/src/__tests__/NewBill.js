/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js";


describe("Given I am connected as an employee", () => {

  // test page New Bill

  describe("When I am on NewBill Page", () => {
    describe("when uploading a file with the correct format", () => {
      test("should save the user's email", () => {

        const mockGetElementById = jest.fn().mockReturnValue({});
        const createMock = jest.fn().mockResolvedValue({ fileUrl: "fileURL", key: "key" });
        const goodFormatFile = new File(['img'], 'image.png', { type: 'image/png' });

        const documentMock = {
          querySelector: (selector) => {
            if (selector === 'input[data-testid="file"]') {
              return {
                files: [goodFormatFile],
                addEventListener: jest.fn(),
              };
            } else {
              return { addEventListener: jest.fn() };
            }
          },
          getElementById: mockGetElementById,
        };

        localStorage.setItem("user", '{"email" : "user@email.com"}');

        const storeMock = {
          bills: () => ({
            create: createMock,
          }),
        };
        const objInstance = new NewBill({
          document: documentMock,
          onNavigate: {},
          store: storeMock,
          localStorage: {},
        });

        objInstance.handleChangeFile({
          preventDefault: jest.fn(),
          target: { value: "image.png" },
        });

        const expectedEmail = "user@email.com";
        const formData = createMock.mock.calls[0][0].data;
        console.log('formData', formData);

        expect(formData.get("email")).toEqual(expectedEmail);
      });
    });

    // test d'integration POST New Bill

    describe('when submitting a new bill', () => {
      test('should call the update method on the store', () => {

        const mockGetElementById = jest.fn().mockReturnValue({});
        const goodFormatFile = new File(['img'], 'image.png', { type: 'image/png' });
        const mockUpdate = jest.fn().mockResolvedValue({});

        const documentMock = {
          querySelector: (selector) => {
            if (selector === 'input[data-testid="file"]') {
              return {
                files: [goodFormatFile],
                addEventListener: jest.fn(),
              };
            } else {
              return { addEventListener: jest.fn() };
            }
          },
          getElementById: mockGetElementById,
        };
        const storeMock = {
          bills: () => ({
            update: mockUpdate,
          }),
        };

        const objInstance = new NewBill({
          document: documentMock,
          onNavigate: jest.fn(),
          store: storeMock,
          localStorage: {},
        });

        objInstance.handleSubmit({
          preventDefault: jest.fn(),
          target: {
            querySelector: (selector) => {
              switch (selector) {
                case 'select[data-testid="expense-type"]':
                  return { value: 'type' };
                case 'input[data-testid="expense-name"]':
                  return { value: 'name' };
                case 'input[data-testid="amount"]':
                  return { value: '3000' };
                case 'input[data-testid="datepicker"]':
                  return { value: 'date' };
                case 'input[data-testid="vat"]':
                  return { value: 'vat' };
                case 'input[data-testid="pct"]':
                  return { value: '25' };
                case 'textarea[data-testid="commentary"]':
                  return { value: 'commentary' };
              }
            },
          },
        });

        const dataToCheck = {
          email: 'user@email.com',
          type: 'type',
          name: 'name',
          amount: 3000,
          date: 'date',
          vat: 'vat',
          pct: 25,
          commentary: 'commentary',
          fileUrl: null,
          fileName: null,
          status: 'pending',
        };

        const data = JSON.parse(mockUpdate.mock.calls[0][0].data);
        console.log('data?', data);

        expect(data).toMatchObject(dataToCheck);
      });
    });
  });
});  