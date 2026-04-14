import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { AgreementTerms } from "@/types/database";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 20,
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
  },
  paragraph: {
    marginBottom: 8,
    textAlign: "justify",
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#cccccc",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    fontSize: 8,
    color: "#666666",
    textAlign: "center",
  },
  signatureSection: {
    marginTop: 30,
  },
  signatureBlock: {
    marginTop: 15,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#cccccc",
  },
});

function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

function formatEUR(amount: number): string {
  return `EUR ${amount.toLocaleString("ro-RO")}`;
}

interface Props {
  terms: AgreementTerms;
  signatures?: Array<{
    name: string;
    signed_at: string;
    ip_address: string;
  }>;
  generatedAt: string;
}

export function AgreementDocument({ terms, signatures, generatedAt }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <Text style={styles.title}>
          CONTRACT DE COPROPRIETATE AERONAVA
        </Text>
        <Text style={{ textAlign: "center", marginBottom: 20, fontSize: 10, color: "#666" }}>
          Aircraft Co-Ownership Master Agreement
        </Text>

        {/* Article 1: Parties */}
        <Text style={styles.subtitle}>Articolul 1. Partile contractante</Text>
        <View style={styles.section}>
          {terms.members.map((member, i) => (
            <View key={i} style={styles.memberRow}>
              <Text>
                {i + 1}. {member.name} ({member.email})
              </Text>
              <Text style={styles.bold}>{bpsToPercent(member.ownership_bps)}</Text>
            </View>
          ))}
        </View>

        {/* Article 2: Aircraft */}
        <Text style={styles.subtitle}>
          Articolul 2. Aeronava
        </Text>
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            Obiectul prezentului contract este aeronava cu urmatoarele
            caracteristici:
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Indicativ de inmatriculare:</Text>{" "}
            {terms.aircraft_tail_number}
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Tip aeronava:</Text> {terms.aircraft_type}
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Valoare estimata:</Text>{" "}
            {formatEUR(terms.aircraft_value)}
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Aerodrom de baza:</Text>{" "}
            {terms.home_airfield}
          </Text>
        </View>

        {/* Article 3: Ownership */}
        <Text style={styles.subtitle}>
          Articolul 3. Cotele de proprietate
        </Text>
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            Coproprietarii detin urmatoarele cote-parti din aeronava:
          </Text>
          {terms.members.map((member, i) => (
            <Text key={i} style={styles.paragraph}>
              {member.name}: {bpsToPercent(member.ownership_bps)} (
              {formatEUR(
                (terms.aircraft_value * member.ownership_bps) / 10000
              )}
              )
            </Text>
          ))}
        </View>

        {/* Article 4: ROFR */}
        <Text style={styles.subtitle}>
          Articolul 4. Dreptul de preemptiune (ROFR)
        </Text>
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            In cazul in care un coproprietar doreste sa vanda cota sa de
            proprietate, ceilalti coproprietari au drept de preemptiune pe o
            perioada de{" "}
            <Text style={styles.bold}>{terms.rofr_window_days} zile</Text> de la
            data notificarii.
          </Text>
          <Text style={styles.paragraph}>
            Odata ce un coproprietar isi exercita dreptul de preemptiune, vanzarea
            catre acesta nu poate fi anulata de catre vanzator.
          </Text>
          <Text style={styles.paragraph}>
            In cazul in care mai multi coproprietari isi exercita dreptul de
            preemptiune, cota se imparte proportional cu cotele existente ale
            acestora, cu exceptia unei intelegeri diferite intre parti.
          </Text>
          <Text style={styles.paragraph}>
            Daca niciun coproprietar nu isi exercita dreptul de preemptiune in
            termenul de {terms.rofr_window_days} zile, vanzatorul poate vinde
            cota sa unui tert, la un pret nu mai mic decat cel oferit
            coproprietarilor.
          </Text>
        </View>

        {/* Article 5: Governance */}
        <Text style={styles.subtitle}>
          Articolul 5. Luarea deciziilor
        </Text>
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            Deciziile majore (intretinere, asigurare, modificari ale contractului)
            necesita acordul coproprietarilor reprezentand cel putin{" "}
            <Text style={styles.bold}>
              {bpsToPercent(terms.voting_threshold_bps)}
            </Text>{" "}
            din cota totala de proprietate.
          </Text>
          {terms.monthly_dues_eur > 0 && (
            <Text style={styles.paragraph}>
              Fiecare coproprietar contribuie lunar cu suma de{" "}
              <Text style={styles.bold}>
                {formatEUR(terms.monthly_dues_eur)}
              </Text>{" "}
              pentru fondul comun de intretinere si asigurare.
            </Text>
          )}
        </View>

        {/* Article 6: Dissolution */}
        <Text style={styles.subtitle}>
          Articolul 6. Dizolvare
        </Text>
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            Sindicatul se dizolva prin: (a) acordul unanim al tuturor
            coproprietarilor; (b) ramanerea unui singur coproprietar; (c)
            pierderea totala a aeronavei. In caz de dizolvare, aeronava se vinde
            si veniturile se impart conform cotelor de proprietate.
          </Text>
        </View>

        <Text style={styles.footer}>
          Document generat de TailStake.com la {generatedAt}. Acest contract are
          valoare juridica de intelegere intre parti. Pentru validare notariala,
          consultati un avocat.
        </Text>
      </Page>

      {/* Signatures Page */}
      {signatures && signatures.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.subtitle}>Semnaturi electronice (click-wrap)</Text>
          <Text style={styles.paragraph}>
            Urmatoarele persoane si-au exprimat acordul electronic cu termenii
            prezentului contract prin apasarea butonului &quot;Sunt de acord&quot; pe
            platforma TailStake.com:
          </Text>
          <View style={styles.signatureSection}>
            {signatures.map((sig, i) => (
              <View key={i} style={styles.signatureBlock}>
                <Text style={styles.bold}>{sig.name}</Text>
                <Text>Data: {sig.signed_at}</Text>
                <Text>IP: {sig.ip_address}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.footer, { bottom: 60 }]}>
            Nota: Aceasta este o semnatura electronica de tip click-wrap si
            constituie dovada acceptarii termenilor contractuali. Pentru o
            semnatura electronica calificata, consultati un furnizor de servicii
            de incredere conform eIDAS.
          </Text>
        </Page>
      )}
    </Document>
  );
}
