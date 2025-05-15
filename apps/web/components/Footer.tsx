import Icon from "@/public/icon";
import { FiGithub } from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";
import { FaLinkedinIn } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="border p-2">
      <div className="py-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
        <div className="flex flex-col justify-center items-start gap-3">
          <div className="flex justify-center items-center gap-1">
            <Icon size="sm" />
            <h1 className="font-medium text-sm md:text-lg">ExceliDraw</h1>
          </div>
          <p className="text-xs md:text-sm max-w-sm">
            From real-time collaboration and powerful customization to intuitive
            tools and seamless workflows.
          </p>
        </div>
        <div className="flex flex-col justify-center items-start gap-3">
          <p className="font-medium text-sm md:text-lg">Connect</p>
          <a
            href="https://github.com/lokeshsainipilani"
            className="flex justify-center items-center gap-3 text-xs md:text-sm"
            target="_blank"
          >
            <FiGithub /> Github
          </a>
          <a
            href="https://x.com/"
            className="flex justify-center items-center gap-3 text-xs md:text-sm"
            target="_blank"
          >
            <FaXTwitter /> X
          </a>
          <a
            href="https://www.linkedin.com/in/lokesh-saini-07549223b/"
            className="flex justify-center items-center gap-3 text-xs md:text-sm"
            target="_blank"
          >
            <FaLinkedinIn /> LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}