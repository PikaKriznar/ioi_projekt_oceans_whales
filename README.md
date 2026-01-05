# Ocean Flow and Whale Presence  
**Data Visualization of Cetacea Patterns and Ocean Dynamics**

Projekt pri predmetu **Interaktivnosti in oblikovanje informacij (IOI)**.  
Interaktivna spletna vizualizacija, ki združuje:
- podatke o pojavljanju kitov (OBIS) -> data/whales_2010_2013, data/whales_2011_2012, data/whales_monthly_counts
- podatke o oceanskem pretoku (ECCO LLC4320 – vertikalni tok *w*) -> data/vertical_flow_w_surface.json
- ter omogoča raziskovalno interakcijo prek časovnih in prostorskih filtrov.

---

## 🌐 Zagon spletne aplikacije (frontend)

Projekt je **statična spletna stran** in mora teči prek lokalnega HTTP strežnika.

### Zagon spletne strani
1. Zaženemo strežnik
```bash
cd /root/of/project

python3 -m http.server 8000
```

2. V spletnem brskalniku odpremo:
http://localhost:8000

### Zagon skripte za preprocesiranje ECCO podatkov

```bash
python scripts/preprocess_ecco_currents.py \
  --w_url "pelican://osg-htc.org/nasa/nsdf/climate2/llc4320/idx/w/w_llc4320_x_y_depth.idx" \
  --latlon_nc "/Users/pikakriznar/Documents/1_letnik_MAG/IOI/IOI_Projekt/data/vis/llc4320_latlon.nc" \
  --nsteps 12 \
  --stride 8 \
  --quality -12
```

## Uporabljeni podatki

- Whale presence: OBIS (Ocean Biodiversity Information System)

- Ocean flow (w): ECCO LLC4320 (NASA / SciVis Contest 2026)

* Opomba: w predstavlja vertikalni pretok (upwelling/downwelling), ne horizontalnih tokov.
  
    w > 0 → gibanje navzgor
  
    w < 0 → gibanje navzdol

## Avtorji

Pika Križnar, Manca Vidmar, Tilen Lampret, Janez Koprivec

Ustvarjeno v sklopu predmeta Interaktivnosti in oblikovanje informacij

Fakulteta za elektrotehniko, Univerza v Ljubljani


