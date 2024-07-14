import abi from "../utils/BuyMeACoffee.json";
import { ethers } from "ethers";
import Head from "next/head";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";

export default function Home() {
  // Contract Address & ABI
  const contractAddress = "0xb7024ba115aa7e107877b5c397a417dd931e6e68";
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
      if (!ethereum) {
        console.log("Make sure you have MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        const account = accounts[0];
        console.log("Wallet is connected: " + account);
        setCurrentAccount(account);
      } else {
        console.log("Make sure MetaMask is connected");
      }
    } catch (error) {
      console.log("Error checking wallet connection: ", error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Please install MetaMask");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected to account: " + accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log("Error connecting to wallet: ", error);
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
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          provider
        );

        console.log("Fetching memos from the blockchain...");
        const fetchedMemos = await buyMeACoffee.getMemos();
        console.log("Fetched memos: ", fetchedMemos);

        const formattedMemos = fetchedMemos.map((memo) => ({
          from: memo.from,
          timestamp: memo.timestamp.toNumber(),
          name: memo.name,
          message: memo.message,
        }));

        setMemos((prevMemos) => {
          const allMemos = [...prevMemos, ...formattedMemos];
          const uniqueMemos = allMemos.reduce((acc, current) => {
            const isDuplicate = acc.some(
              (memo) =>
                memo.timestamp === current.timestamp && memo.from === current.from
            );
            if (!isDuplicate) {
              acc.push(current);
            }
            return acc;
          }, []);
          return uniqueMemos;
        });
      } else {
        console.log("MetaMask is not connected");
      }
    } catch (error) {
      console.log("Error fetching memos: ", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await isWalletConnected();
      if (currentAccount) {
        await getMemos();
      }
    };
    init();

    const onNewMemo = (from, timestamp, name, message) => {
      console.log("New memo received: ", from, timestamp, name, message);
      setMemos((prevState) => [
        ...prevState,
        {
          from,
          timestamp: new Date(timestamp * 1000).toLocaleString(),
          name,
          message,
        },
      ]);
    };

    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      const signer = provider.getSigner();
      const buyMeACoffee = new ethers.Contract(contractAddress, contractABI, signer);

      buyMeACoffee.on("NewMemo", onNewMemo);
    }

    return () => {
      if (buyMeACoffee) {
        buyMeACoffee.off("NewMemo", onNewMemo);
      }
    };
  }, [currentAccount]);

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
                Connect your wallet
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
                  From: {memo.name} at {memo.timestamp}
                </p>
              </div>
            );
          })}
      </div>
      <footer className={styles.footer}>
        <a
          href="https://apaberg.ir"
          target="_blank"
          rel="noopener noreferrer"
        >
          Designed by APAberg Company. Pay us a visit by clicking here.
        </a>
      </footer>
    </div>
  );
}