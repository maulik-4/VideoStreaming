import React from 'react';
import { FaLinkedin, FaGithub, FaYoutube } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

function Footer() {
  return (
    <footer className="text-gray-400 py-8 px-4 md:px-12 backdrop-blur-sm relative z-10 w-full transition-all duration-300" style={{background:'var(--card)', borderTop:'1px solid rgba(255,255,255,0.03)'}}>
      <div className="max-w-7xl mx-auto glass-card p-6 rounded-lg">
        {/* Top Section with links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-gray-800/30">
          {/* About */}
          <div>
              <h3 className="text-main font-medium text-lg mb-4 flex items-center">
              <FaYoutube className="text-red-600 mr-2 text-xl" />
              YouTube Clone
            </h3>
              <p className="text-sm text-muted leading-relaxed">
              A full-featured YouTube clone built with React, Node.js, and MongoDB.
              Browse, upload, and interact with videos just like the real platform.
            </p>
          </div>

          {/* Quick Links - Removed trending and subscriptions */}
          <div>
              <h3 className="text-main font-medium text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="hover:text-blue-400 transition-colors duration-200">Home</a>
              </li>
              <li>
                <a href="https://portfolio-9dyt.vercel.app/" target='blank' className="hover:text-blue-400 transition-colors duration-200">Portfolio</a>
              </li>
              <li>
                <a href="/upload" className="hover:text-blue-400 transition-colors duration-200">Upload</a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
              <h3 className="text-main font-medium text-lg mb-4">Connect</h3>
            <div className="flex gap-4 mb-4">
              <a
                href="https://www.linkedin.com/in/maulik-vijay-681707283/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full transition-all duration-300 accent-btn shadow-md"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="text-xl" />
              </a>
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=maulikvijay4@gmail.com&su=Hello+Maulik&body=This+is+a+pre-filled+message"
                target='blank'
                className="p-2.5 rounded-full transition-all duration-300 bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md"
                aria-label="Email"
              >
                <MdEmail className="text-xl" />
              </a>
              <a
                href="https://github.com/maulik-4"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full transition-all duration-300 bg-white/6 hover:bg-white/10 text-white shadow-md"
                aria-label="GitHub"
              >
                <FaGithub className="text-xl" />
              </a>
            </div>
            <p className="text-sm text-gray-500">Get in touch for opportunities or feedback</p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-center text-sm" style={{color:'var(--muted)'}}>
            © {new Date().getFullYear()} YouTube Clone. All rights reserved.
          </p>
          <p className="text-center text-sm flex items-center" style={{color:'var(--muted)'}}>
            <span className="inline-block animate-pulse text-red-500 mr-1">❤️</span>
            Made with passion by Maulik Vijay
          </p>
          <div className="text-sm">
            <a  className="cursor-pointer hover:text-white transition-colors duration-200 mr-4" style={{color:'var(--muted)'}}>
              Privacy
            </a>
            <a  className=" cursor-pointer hover:text-white transition-colors duration-200" style={{color:'var(--muted)'}}>
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;