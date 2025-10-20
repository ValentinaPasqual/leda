## NOTES

# Dataset 

```public/data/``` should contain 3 files, 1 json and two TSV files:
- ```locations.tsv``` contains data pertaining the locations
- ```references.tsv``` contains data pertaining the references (catalogue)


# Struttura del Dataset con Tabelle Collegate

Il dataset è composto da **due file TSV collegati** tramite una **colonna pivot** che permette all'applicazione di allineare e correlare i dati.

---

## File Principali

### 1. `locations.tsv`
Contiene i dati geografici.

**Colonne obbligatorie:**
- `Location` - nome del luogo
- `lat_long` - coordinate geografiche

### 2. `references.tsv`
Contiene i riferimenti, eventi o documenti.

**Colonne obbligatorie:**
- `ID` - identificatore unico
- Colonna pivot (vedi sotto)

---

## La Colonna Pivot

La **colonna pivot** è la colonna che:
- **Condivide lo stesso nome** in entrambe le tabelle
- **Contiene gli stessi valori** per creare il collegamento
- **Determina la relazione** tra i due file

L'applicazione utilizza questa colonna per allineare e correlare automaticamente i dati delle due tabelle.

---

## Esempi di Strutture

### Esempio 1: Pivot su `Location`

**Caso d'uso:** Mappare eventi o riferimenti associati a luoghi specifici

#### `locations.tsv`
Ogni riga rappresenta un **luogo** (es. una montagna).

| Location | lat_long | Altitudine | Provincia |
|----------|----------|------------|-----------|
| Monte Bianco | 45.8333,6.8642 | 4808m | Aosta |
| Matterhorn | 45.9763,7.6586 | 4478m | Aosta |

#### `references.tsv`
Ogni riga rappresenta un **evento o riferimento** collegato a un luogo.

| ID | Location | Data | Descrizione |
|----|----------|------|-------------|
| REF001 | Monte Bianco | 1786-08-08 | Prima ascensione |
| REF002 | Monte Bianco | 1965-02-15 | Spedizione invernale |
| REF003 | Matterhorn | 1865-07-14 | Prima ascensione |

**Relazione:** Molti eventi (references) → Un luogo (location)

---

### Esempio 2: Pivot su `Titolo del riferimento`

**Caso d'uso:** Mappare le menzioni geografiche trovate in documenti o riferimenti bibliografici

#### `references.tsv`
Ogni riga rappresenta un **documento o riferimento bibliografico**.

| ID | Titolo del riferimento | Autore | Anno |
|----|------------------------|--------|------|
| REF001 | Viaggio nelle Alpi | G. Rossi | 1823 |
| REF002 | Esplorazioni del Monte Rosa | A. Verdi | 1842 |

#### `locations.tsv`
Ogni riga rappresenta una **menzione geografica** trovata in un riferimento.

| Location | lat_long | Titolo del riferimento | Pagina |
|----------|----------|------------------------|--------|
| Cervino | 45.9763,7.6586 | Viaggio nelle Alpi | 45 |
| Aosta | 45.7370,7.3205 | Viaggio nelle Alpi | 12 |
| Monte Rosa | 45.9372,7.8670 | Esplorazioni del Monte Rosa | 8 |
| Macugnaga | 45.9667,7.9667 | Esplorazioni del Monte Rosa | 23 |

**Relazione:** Molti luoghi (locations) → Un riferimento (reference)

---

## Riepilogo

| Aspetto | Descrizione |
|---------|-------------|
| **Colonna pivot** | Colonna con stesso nome e valori in entrambe le tabelle |
| **Funzione** | Permette all'app di collegare automaticamente i due file |
| **Flessibilità** | La scelta della colonna pivot determina quale entità è "principale" e quale è "correlata" |
| **Relazione** | Può essere 1:molti in entrambe le direzioni, a seconda della colonna pivot scelta |

---

## Note Tecniche

- I nomi delle colonne pivot devono corrispondere **esattamente** (case-sensitive)
- I valori nella colonna pivot devono corrispondere **esattamente** per creare il collegamento
- È possibile avere colonne aggiuntive in entrambi i file oltre a quelle obbligatorie
- Il formato TSV (Tab-Separated Values) deve essere rispettato per entrambi i file


- ```polygons.tsv``` contains dataset to be reconciled with the locations stored in ```locations.tsv``` -- SEE BUILD THE POLYGONS.json FILE

SPIEGA ANCHE CHE LE TABELLE POSSONO ESSERE 1-N O N-1.

Tabella 

# Images
```public/imgs/``` should contain the image of the main logo of your website and should contain the string ```logo``` in it. 

```public/imgs/institutional_logos``` should contain all logos related to the project, all images that you want to include should be added here. In order to make them appear in the Footer of website, you should list the file names in the ```public/imgs/institutional_logos/manifest.json``` file.

If the ```manifest.json``` file is left empty the footer section will not display any logo. 

# DOCX documents TBD
rELATED FOLDER + MANIFEST ANCHE PER QUESTO <3

# Configuration File Documentation

This documentation explains how to configure your interactive map application using the JSON configuration file.

## Overview

The configuration file is a JSON document that defines all aspects of your interactive map application, including project metadata, map settings, search functionality, and data visualization options.

## Configuration Structure

### Project Section

```json
{
  "project": {
    "projectShortTitle": "[SHORT_PROJECT_NAME]",
    "projectThumbnailURL": "[PATH_TO_LOGO]",
    "projectTitle": "[FULL_PROJECT_TITLE]",
    "projectSubtitle": "[PROJECT_SUBTITLE]",
    "projectDescription": "[HTML_FORMATTED_DESCRIPTION]",
    "mapInfoTitle": "[MAP_INFO_HEADER]",
    "mapInfoDescription": "[MAP_USAGE_INSTRUCTIONS]"
  }
}
```

**Parameters:**
- `projectShortTitle`: A brief identifier for your project
- `projectThumbnailURL`: Relative or absolute path to your project logo
- `projectTitle`: The complete title displayed in the application
- `projectSubtitle`: Secondary title or tagline
- `projectDescription`: Detailed project description (HTML supported with `<br>` tags)
- `mapInfoTitle`: Header text for map information panel
- `mapInfoDescription`: Instructions for users on how to interact with the map

### Dataset Configuration

```json
{
  "datasetConfig": {
    "multivalue_rows": {
      "[FIELD_NAME_1]": "[DELIMITER_1]",
      "[FIELD_NAME_2]": "[DELIMITER_2]"
    }
  }
}
```

**Purpose:** Defines how to handle fields that contain multiple values separated by specific delimiters.

**Example:**
- `"[LOCATION_TYPE]": ", "` - Values separated by comma and space
- `"[SPACE_TYPE]": "; "` - Values separated by semicolon and space

### Result Cards Configuration

```json
{
  "result_cards": {
    "card_title": "[PRIMARY_FIELD]",
    "card_subtitle": "[SECONDARY_FIELD]",
    "card_subtitle_2": "[TERTIARY_FIELD]",
    "card_description": "[DESCRIPTION_FIELD]"
  }
}
```

**Purpose:** Maps data fields to card display elements in search results.

### Map Configuration

```json
{
  "map": {
    "initialView": [LATITUDE, LONGITUDE],
    "initialZoom": ZOOM_LEVEL,
    "tileLayers": {
      "[LAYER_NAME_1]": {
        "tileLayer": "[TILE_SERVER_URL]",
        "attribution": "[COPYRIGHT_TEXT]"
      },
      "[LAYER_NAME_2]": {
        "tileLayer": "[TILE_SERVER_URL]",
        "attribution": "[COPYRIGHT_TEXT]"
      }
    }
  }
}
```

**Parameters:**
- `initialView`: [latitude, longitude] coordinates for initial map center
- `initialZoom`: Integer zoom level (1-18, where higher numbers show more detail)
- `tileLayers`: Object containing different map layer options

**Common Tile Servers:**
- OpenStreetMap: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Stamen Terrain: `https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png`
- Stamen Toner: `https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png`

### Map Popups Configuration

```json
{
  "map_popups": {
    "show_polygons": "True|False",
    "show_related_pins": "True|False"
  }
}
```

**Parameters:**
- `show_polygons`: Whether to display area boundaries on the map
- `show_related_pins`: Whether to show related location markers

### Search Configuration

```json
{
  "searchConfig": {
    "debounceTime": MILLISECONDS,
    "defaultSort": "[DEFAULT_SORT_OPTION]",
    "sortOptions": [
      {"value": "[SORT_KEY_1]", "label": "[DISPLAY_LABEL_1]"},
      {"value": "[SORT_KEY_2]", "label": "[DISPLAY_LABEL_2]"}
    ]
  }
}
```

**Parameters:**
- `debounceTime`: Delay in milliseconds before executing search (recommended: 300)
- `defaultSort`: Default sorting method from `sortOptions`
- `sortOptions`: Array of available sorting options

### Results Display Configuration

```json
{
  "resultsDisplay": {
    "tagsToShow": ["[FIELD_1]", "[FIELD_2]"]
  }
}
```

**Purpose:** Specifies which data fields to display as tags in search results.

### Sorting Configuration

```json
{
  "sortings": {
    "[SORT_KEY]": {
      "field": "[DATA_FIELD_NAME]",
      "order": "asc|desc"
    }
  }
}
```

**Purpose:** Defines how each sorting option works.

**Example:**
```json
{
  "title_desc": {
    "field": "Title",
    "order": "desc"
  }
}
```

### Aggregations (Filters) Configuration

```json
{
  "aggregations": {
    "[FILTER_KEY]": {
      "title": "[DISPLAY_NAME]",
      "category": "[FILTER_CATEGORY]",
      "size": NUMBER_OF_OPTIONS,
      "conjunction": true|false,
      "type": "simple|taxonomy|range"
    }
  }
}
```

**Parameters:**
- `title`: Display name for the filter
- `category`: Groups filters under categories in the UI
- `size`: Maximum number of filter options to show
- `conjunction`: Whether selections use AND (true) or OR (false) logic
- `type`: Filter behavior type:
  - `simple`: Basic list of options
  - `taxonomy`: Hierarchical categorization (data must use `>` separator, e.g., "Category > Subcategory > Item")
  - `range`: Numeric range slider (data must contain integers only)

### Searchable Fields Configuration

```json
{
  "searchableFields": ["[FIELD_1]", "[FIELD_2]", "[FIELD_3]"]
}
```

**Purpose:** Defines which data fields are included in text search functionality.

## Data Field Mapping

Your CSV data should contain columns that correspond to the field names referenced in your configuration. Common field types include:

- **Location fields**: Geographic places or regions
- **Content fields**: Titles, descriptions, authors
- **Categorical fields**: Types, classifications, genres
- **Temporal fields**: Dates, years, periods
- **Descriptive fields**: Detailed descriptions or analysis

## Best Practices

1. **Field Names**: Use consistent field names between your CSV data and configuration
2. **Delimiters**: Choose clear delimiters for multi-value fields (avoid characters that appear in your data)
3. **Categories**: Group related filters under logical categories for better UX
4. **Search Fields**: Include the most relevant fields for text search
5. **Sort Options**: Provide both ascending and descending options for key fields
6. **Map Bounds**: Set initial view to best showcase your data geographic distribution

## Validation Tips

- Ensure all referenced field names exist in your data
- Test different zoom levels to find the optimal initial view
- Verify tile layer URLs are accessible and properly attributed
- Check that delimiter characters don't conflict with your data content

## Example Workflow

1. Prepare your CSV data with consistent column names
2. Copy this configuration template
3. Replace all `[PLACEHOLDER]` values with your specific field names and settings
4. Test the configuration with a small data subset
5. Adjust map bounds, zoom levels, and filter options based on your data
6. Deploy and iterate based on user feedback
