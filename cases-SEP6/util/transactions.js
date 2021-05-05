import { fetch } from "../../util/fetchShim";
import { getTransactionSchema } from "./schema";
import faker from "faker";
import FormData from "form-data";

// Data required in GET /deposit or /withdraw request for each anchor
const anchorRequestData = {
  stellar: {
    deposit: {
      type: "bank_account",
    },
    withdraw: {
      type: "bank_account",
      dest: "fake bank number",
      dest_extra: "fake bank routing number",
    },
    kyc: {
      first_name: "First",
      last_name: "Last",
      email_address: "email@email.com",
      bank_number: "fake bank routing number",
      bank_account_number: "fake bank number",
    },
  },
  clickpesa: {
    deposit: {
      type: "bank_account",
      amount: "6000",
    },
    withdraw: {
      type: "bank_account",
      dest: faker.finance.account(),
      payout_channel_provider: faker.company.companyName(),
      payout_address_name: faker.finance.accountName(),
      routing_number: faker.finance.routingNumber(),
      amount: "10000",
    },
    kyc: {
      first_name: faker.name.firstName(),
      last_name: faker.name.lastName(),
      email_address: faker.internet.email(),
      mobile_number: faker.phone.phoneNumber(),
      type: "individual",
      id_type: "NIDA",
      id_number: faker.datatype.uuid(),
      photo_id_front: "http://image.url",
    },
  },
};

export async function putKYCInfo({ toml, account, jwt }) {
  const params = new FormData();
  params.append("account", account);
  let anchorReqData = getRequestData("kyc");
  for (let key in anchorReqData) {
    params.append(key, anchorReqData[key]);
  }

  const response = await fetch(toml.KYC_SERVER + "/customer", {
    headers: { Authorization: `Bearer ${jwt}` },
    method: "PUT",
    body: params,
  });

  const status = response.status;
  expect(status).toEqual(202);
  const json = await response.json();

  return {
    status,
    json,
  };
}

export async function createTransaction({
  currency,
  account,
  toml,
  jwt,
  isDeposit,
}) {
  const headers = { Authorization: `Bearer ${jwt}` };

  let params = new URLSearchParams();
  if (currency) params.append("asset_code", currency);
  if (account) params.append("account", account);

  let anchorReqData = getRequestData(isDeposit ? "deposit" : "withdraw");
  for (let [key, value] of Object.entries(anchorReqData)) {
    params.append(key, value);
  }

  const transactionsUrl =
    toml.TRANSFER_SERVER + `/${isDeposit ? "deposit" : "withdraw"}`;
  const response = await fetch(transactionsUrl + "?" + params.toString(), {
    headers,
  });

  const status = response.status;
  const json = await response.json();

  return {
    status,
    json,
  };
}

function getRequestData(transactionType) {
  let anchor = process.env.ANCHOR.toLowerCase();
  for (let key in anchorRequestData) {
    if (key === anchor) {
      return anchorRequestData[anchor][transactionType];
    }
  }
}
