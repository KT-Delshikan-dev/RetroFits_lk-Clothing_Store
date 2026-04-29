import { Client, Account, Databases } from "appwrite";

const client = new Client()
    .setEndpoint("https://sgp.cloud.appwrite.io/v1")
    .setProject("69f1cb840006d2bde03e");

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases };
