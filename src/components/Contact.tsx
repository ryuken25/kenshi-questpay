"use client";

import { motion } from "framer-motion";
import { Github, Twitter, MessageCircle, Mail } from "lucide-react";
import { APP_CONFIG } from "@/lib/config";

const contacts = [
  {
    icon: Github,
    label: "GitHub",
    value: APP_CONFIG.creator.github,
    href: APP_CONFIG.creator.github,
  },
  {
    icon: Twitter,
    label: "X (Twitter)",
    value: APP_CONFIG.creator.x,
    href: APP_CONFIG.creator.x,
  },
  {
    icon: MessageCircle,
    label: "Discord",
    value: APP_CONFIG.creator.discord,
    href: "#",
  },
  {
    icon: Mail,
    label: "Email",
    value: APP_CONFIG.creator.email,
    href: `mailto:${APP_CONFIG.creator.email}`,
  },
];

export default function Contact() {
  return (
    <section id="contact" className="py-20 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-sora text-3xl sm:text-4xl font-bold text-white mb-4">
            Get in <span className="gradient-text">Touch</span>
          </h2>
          <p className="text-gray-400 font-inter">Reach out via any channel</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contacts.map((contact, i) => (
            <motion.a
              key={contact.label}
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="glass-panel rounded-xl p-6 flex items-center gap-4 hover:border-verse-purple/30 transition-all group"
            >
              <contact.icon className="w-6 h-6 text-verse-purple group-hover:text-verse-blue transition-colors" />
              <div>
                <p className="text-sm text-gray-500 font-inter">{contact.label}</p>
                <p className="text-sm text-white font-mono">{contact.value}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
