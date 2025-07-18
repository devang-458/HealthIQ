import Image, { type ImageProps } from "next/image";
import { Button } from "@repo/ui/button";
import styles from "./page.module.css";
import SignInPage from "./auth/signin/page";


export default function Home() {
  return (
    <div className={styles.page}>
      <SignInPage />
    </div>
  );
}
