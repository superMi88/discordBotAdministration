
import React, { useEffect, useState } from "react";
import Head from 'next/head'
import Link from 'next/link'

export const siteTitle = 'Projekt Übersicht'

export default function Index() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data));
  }, []);

  return (
    <>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Verfügbare Projekte</h1>
        <div style={{ display: 'grid', gap: '20px' }}>
          {projects.map(project => (
            <div key={project.name} style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
              <h2>{project.alias}</h2>
              <p>{project.description}</p>
              <Link href={`/${project.name}/login/`}>
                <button style={{ padding: '10px 20px', cursor: 'pointer' }}>Projekt Verwalten</button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}