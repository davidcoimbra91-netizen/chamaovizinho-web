'use client'

import type { Metadata } from 'next'
import Link from 'next/link'
import { useState } from 'react'

export default function EliminarContaPage() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 15% 20%, rgba(234,111,55,0.13), transparent 28%), radial-gradient(circle at 85% 75%, rgba(234,111,55,0.10), transparent 30%), #f7efe4',
      fontFamily: 'Inter, Arial, sans-serif',
      color: '#2f2f2f',
      padding: '48px 20px',
      boxSizing: 'border-box',
    }}>
      <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}
        className="grid-cols-1 sm:grid-cols-2">

        {/* LEFT */}
        <div style={{ padding: 20 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, fontWeight: 800, fontSize: 26, color: '#2f2f2f', textDecoration: 'none' }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: '#e96f37', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, boxShadow: '0 10px 25px rgba(233,111,55,0.25)' }}>⌂</div>
            <span>Chama o Vizinho!</span>
          </Link>
          <h1 style={{ fontSize: 42, lineHeight: 1.08, margin: '0 0 18px', color: '#2d2d2d', letterSpacing: '-0.04em' }}>
            Pedido de eliminação de conta
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: '#5e5a55', margin: '0 0 18px' }}>
            Nesta página pode solicitar a eliminação da sua conta Chama o Vizinho! de forma simples e segura.
          </p>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: '#5e5a55', margin: '0 0 18px' }}>
            Para confirmar a identidade do titular da conta, indique o seu email ou nome de utilizador e a sua palavra-passe.
          </p>
          <div style={{ marginTop: 26, background: 'rgba(255,255,255,0.62)', border: '1px solid rgba(233,111,55,0.22)', borderRadius: 22, padding: 18, fontSize: 15, lineHeight: 1.55, color: '#4b4743' }}>
            <strong>Importante:</strong> após o envio do pedido, a equipa irá analisar a solicitação e proceder à eliminação dos dados pessoais associados à conta, salvo quando exista obrigação legal de conservação.
          </div>
        </div>

        {/* RIGHT — card */}
        <div style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: 30, padding: 34, boxShadow: '0 25px 70px rgba(74,58,45,0.14)', backdropFilter: 'blur(12px)' }}>
          <h2 style={{ fontSize: 26, margin: '0 0 8px', color: '#2f2f2f' }}>Confirmar pedido</h2>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: '#6a655f', marginBottom: 26 }}>
            Preencha os dados abaixo para solicitar a eliminação da sua conta.
          </p>

          {!submitted ? (
            <form onSubmit={e => { e.preventDefault(); setSubmitted(true) }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label htmlFor="del-email" style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#3f3b37', marginBottom: 8 }}>
                  Email ou nome de utilizador
                </label>
                <input id="del-email" type="text" placeholder="exemplo@email.com" autoComplete="username" required
                  style={{ width: '100%', height: 52, border: '1px solid #e2d7c9', borderRadius: 16, padding: '0 16px', fontSize: 15, outline: 'none', color: '#2f2f2f', background: '#fffaf4', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label htmlFor="del-password" style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#3f3b37', marginBottom: 8 }}>
                  Palavra-passe
                </label>
                <input id="del-password" type="password" placeholder="Introduza a sua palavra-passe" autoComplete="current-password" required
                  style={{ width: '100%', height: 52, border: '1px solid #e2d7c9', borderRadius: 16, padding: '0 16px', fontSize: 15, outline: 'none', color: '#2f2f2f', background: '#fffaf4', boxSizing: 'border-box' }} />
              </div>
              <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#fff7ee', border: '1px solid #eadccc', borderRadius: 18, padding: 15, fontSize: 14, lineHeight: 1.45, color: '#504b46' }}>
                <input type="checkbox" required style={{ marginTop: 3, accentColor: '#e96f37', width: 18, height: 18, flexShrink: 0 }} />
                <span>Confirmo que pretendo solicitar a eliminação da minha conta Chama o Vizinho! e compreendo que este pedido poderá levar à perda de acesso aos meus dados e histórico associado.</span>
              </label>
              <button type="submit" style={{ height: 54, border: 'none', borderRadius: 18, background: '#e96f37', color: 'white', fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 14px 28px rgba(233,111,55,0.28)' }}>
                Solicitar eliminação da conta
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 74, height: 74, borderRadius: '50%', background: '#e96f37', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 800, margin: '0 auto 22px', boxShadow: '0 12px 25px rgba(233,111,55,0.35)' }}>✓</div>
              <h3 style={{ margin: '0 0 12px', fontSize: 28, color: '#2f2f2f' }}>Pedido enviado</h3>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#5f5a54' }}>O seu pedido de eliminação de conta foi registado com sucesso. A nossa equipa irá analisar o pedido brevemente.</p>
              <button onClick={() => setSubmitted(false)} style={{ marginTop: 26, width: '100%', height: 52, border: 'none', borderRadius: 16, background: '#e96f37', color: 'white', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
                Fechar
              </button>
            </div>
          )}

          <p style={{ marginTop: 18, fontSize: 13, lineHeight: 1.5, color: '#77716b', textAlign: 'center' }}>
            Este formulário não elimina automaticamente a conta. Ele regista o pedido para tratamento pela equipa Chama o Vizinho!.
          </p>
          <div style={{ marginTop: 22, textAlign: 'center', fontSize: 14 }}>
            <Link href="/" style={{ color: '#e96f37', fontWeight: 700, textDecoration: 'none' }}>Voltar à página inicial</Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 820px) {
          div[style*="gridTemplateColumns: '1fr 1fr'"] { grid-template-columns: 1fr !important; }
          h1 { font-size: 34px !important; }
        }
      `}</style>
    </div>
  )
}
