import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PenLine, Hourglass, Orbit } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-4">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-amber-500/10"
            style={{
              width: Math.random() * 200 + 50,
              height: Math.random() * 200 + 50,
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="mb-4 text-5xl font-medium tracking-wide md:text-6xl">
            <span className="gradient-text">美好时光机</span>
          </h1>
          <p className="mx-auto max-w-md text-lg text-text-muted">
            用多维度的感官记录，珍藏你的每一段时光。
            <br />
            不是保存照片，而是保存那一刻的<span className="gradient-text font-serif text-2xl font-semibold">你</span>
          </p>
        </motion.div>

        <motion.div
          className="mt-12 grid gap-4 sm:grid-cols-3 sm:gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Link
            to="/record"
            className="group relative overflow-hidden rounded-2xl border border-border bg-bg-card p-8 text-left transition-all hover:border-amber-500/30 hover:bg-bg-card-hover"
          >
            <div className="absolute right-4 top-4 rounded-full bg-amber-500/10 p-2 group-hover:bg-amber-500/20 transition-colors">
              <PenLine className="h-5 w-5 text-amber-500" />
            </div>
            <h2 className="text-xl font-medium text-text">记录美好</h2>
            <p className="mt-2 text-sm text-text-muted">
              记录当下的感受、所见、所闻、所触...
              <br />
              让每一刻都被温柔收藏
            </p>
          </Link>

          <Link
            to="/revisit"
            className="group relative overflow-hidden rounded-2xl border border-border bg-bg-card p-8 text-left transition-all hover:border-pink-500/30 hover:bg-bg-card-hover"
          >
            <div className="absolute right-4 top-4 rounded-full bg-pink-500/10 p-2 group-hover:bg-pink-500/20 transition-colors">
              <Hourglass className="h-5 w-5 text-pink-500" />
            </div>
            <h2 className="text-xl font-medium text-text">重温时光</h2>
            <p className="mt-2 text-sm text-text-muted">
              穿梭回那些珍贵的时刻...
              <br />
              让过去的自己与现在的你对话
            </p>
          </Link>

          <Link
            to="/universe"
            className="group relative overflow-hidden rounded-2xl border border-border bg-bg-card p-8 text-left transition-all hover:border-purple-500/30 hover:bg-bg-card-hover"
          >
            <div className="absolute right-4 top-4 rounded-full bg-purple-500/10 p-2 group-hover:bg-purple-500/20 transition-colors">
              <Orbit className="h-5 w-5 text-purple-500" />
            </div>
            <h2 className="text-xl font-medium text-text">记忆宇宙</h2>
            <p className="mt-2 text-sm text-text-muted">
              每一段记忆都是一颗星球...
              <br />
              在属于你的星河中漫游，点亮每一段时光
            </p>
          </Link>

        </motion.div>
      </div>

      <p className="relative z-10 mt-16 text-xs text-text-muted/50">
        让未来的你，重新遇见今天的自己
      </p>
    </div>
  )
}
