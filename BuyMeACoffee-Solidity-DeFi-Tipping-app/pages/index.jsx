import abi from "../utils/BuyMeACoffee.json";
import { ethers } from "ethers";
import Head from "next/head";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";

export default function Home() {
  // Contract Address & ABI
  const contractAddress = "0xBf815Cf7a1237530A8274A4839Ea9A5d6630EA2d";
  const contractABI = abi.abi;

  // Component state
  const [currentAccount, setCurrentAccount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState([]);

  const onNameChange = (event) => {
    setName(event.target.value);
  };

  const onMessageChange = (event) => {
    setMessage(event.target.value);
  };

  // Wallet connection logic
  const isWalletConnected = async () => {
    try {
      const { ethereum } = window;

      const accounts = await ethereum.request({ method: "eth_accounts" });
      console.log("accounts: ", accounts);

      if (accounts.length > 0) {
        const account = accounts[0];
        console.log("wallet is connected! " + account);
      } else {
        console.log("make sure MetaMask is connected");
      }
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Please install MetaMask");
      } else {
        // Check if the wallet is connected
        if (!ethereum.isConnected()) {
          console.log("Please connect your wallet");
        } else {
          // Check if the wallet is on the Goerli testnet
          if (ethereum.chainId !== "0x5") {
            try {
              // Try to switch to Goerli testnet
              await ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0x5" }], // Goerli testnet chainId
              });
            } catch (error) {
              // If the user cancels the network change, exit the function
              if (error.message.includes("User rejected request")) {
                console.log("Network change cancelled by user");
                return;
              }
              // If the wallet is not on the Goerli testnet and cannot switch, ask the user to add it
              if (error.code === 4902) {
                try {
                  // Try to add Goerli testnet
                  await ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [
                      {
                        chainId: "0x5",
                        chainName: "Goerli",
                        rpcUrls: ["https://rpc.ankr.com/eth_goerli"],
                        nativeCurrency: {
                          name: "ETH",
                          symbol: "ETH",
                          decimals: 18,
                        },
                        blockExplorerUrls: ["https://goerli.etherscan.io"],
                      },
                    ],
                  });
                } catch (addError) {
                  console.log("Failed to add Goerli testnet", addError);
                }
              }
              console.log(`96.error: ${error.message}`);
            }
          }
          const accounts = await ethereum.request({
            method: "eth_requestAccounts",
          });

          setCurrentAccount(accounts[0]);
        }
      }
    } catch (error) {
      console.log(`107.error: ${error.message}`);
    }
  };

  const buyCoffee = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum, "any");
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("buying coffee..");
        const coffeeTxn = await buyMeACoffee.buyCoffee(
          name ? name : "anon",
          message ? message : "Enjoy your coffee!",
          { value: ethers.utils.parseEther("0.001") }
        );

        await coffeeTxn.wait();

        console.log("mined ", coffeeTxn.hash);

        console.log("coffee purchased!");

        // Clear the form fields.
        setName("");
        setMessage("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Function to fetch all memos stored on-chain.
  const getMemos = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("fetching memos from the blockchain..");
        const memos = await buyMeACoffee.getMemos();
        console.log("fetched!");
        setMemos(memos);
      } else {
        console.log("Metamask is not connected");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let buyMeACoffee;
    isWalletConnected();
    getMemos();

    // Create an event handler function for when someone sends
    // us a new memo.
    const onNewMemo = (from, timestamp, name, message) => {
      console.log("Memo received: ", from, timestamp, name, message);
      setMemos((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message,
          name,
        },
      ]);
    };

    const { ethereum } = window;

    // Listen for new memo events.
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      const signer = provider.getSigner();
      buyMeACoffee = new ethers.Contract(contractAddress, contractABI, signer);

      buyMeACoffee.on("NewMemo", onNewMemo);
    }

    return () => {
      if (buyMeACoffee) {
        buyMeACoffee.off("NewMemo", onNewMemo);
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Buy APA a Coffee!</title>
        <meta name="description" content="Tipping site" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.content}>
        <main className={styles.main}>
          <h1 className={styles.title}>Buy APA a Coffee!</h1>

          {currentAccount ? (
            <div>
              <form>
                <div className={styles.div_input}>
                  <label className={styles.label}>Name</label>

                  <input
                    id="name"
                    autoFocus
                    className={styles.input}
                    type="text"
                    placeholder="Enter your name"
                    onChange={onNameChange}
                  />
                </div>

                <div className={styles.div_input}>
                  <label className={styles.label}>Send APA a message</label>

                  <textarea
                    rows={4}
                    cols={50}
                    className={`${styles.input} ${styles.textarea}`}
                    placeholder="Enjoy your coffee!"
                    id="message"
                    onChange={onMessageChange}
                    required
                  ></textarea>
                </div>
                <div className={styles.div_btn}>
                  <button
                    className={`${styles.btn} ${styles.btn_send}`}
                    type="button"
                    onClick={buyCoffee}
                  >
                    Send 1 Coffee for 0.001ETH
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className={styles.div_btn}>
              <button onClick={connectWallet} className={styles.btn}>
                {" "}
                Connect your wallet{" "}
              </button>
            </div>
          )}
        </main>

        {currentAccount && <h1 className={styles.memos}>Memos received</h1>}

        {currentAccount &&
          memos.map((memo, idx) => {
            return (
              <div
                key={idx}
                style={{
                  border: "2px solid",
                  borderRadius: "5px",
                  padding: "5px",
                  margin: "5px",
                }}
              >
                <p style={{ fontWeight: "bold" }}>{memo.message}</p>
                <p>
                  From: {memo.name} at {memo.timestamp.toString()}
                </p>
              </div>
            );
          })}
      </div>
      <footer className={styles.footer}>
        <a
          href="https://alchemy.com/?a=roadtoweb3weektwo"
          target="_blank"
          rel="noopener noreferrer"
        >
          Created by @thatguyintech for Alchemy&apos;s Road to Web3 lesson two!{" "}
        </a>
      </footer>
    </div>
  );
}
