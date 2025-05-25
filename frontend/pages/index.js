import Head from 'next/head'; // Optional: for setting page title

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Cashier Login</title>
      </Head>
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <h1>Cashier Login</h1>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
          <div>
            <label htmlFor="cashierName" style={{ display: 'block', marginBottom: '0.5rem' }}>Cashier Name</label>
            <input
              type="text"
              id="cashierName"
              name="cashierName"
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          <button
            type="submit"
            style={{ padding: '0.75rem', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Login
          </button>
        </form>
      </main>
    </>
  );
}
