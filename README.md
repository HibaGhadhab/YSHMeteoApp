# tsi-meteo /Backend 

### Description 
Le projet TSI-Météo comprend deux parties: la partie frontend et la partie backend. YSHMeteoApp représente la partie backend, qui joue le rôle de la sonde numéro 10.
Ce projet a été crée avec:
- *ExpressJS*: génération de l'application.
- *MongoDB*: gestion de la base de données.

### Avant l'installation
- *npm version*: 6.4.1
<br/>
- *Mongodb version*: MongoDB shell version: 2.4.14

### Installation
```
npm install
```

### Exécution
Nous avons crée un service système: *tsimeteo.service* qui est toujours en marche et qui permet l'exécution en permanence de l'API.

### Utilisation
Notre API est accessible avec http://piensg010:3001 où *piensg* est le nom de la sonde et *3001* est le port. 

### API 
L'API expose deux services : 

1. Récupération de la dernière valeur d'une donnée d'un capteur (température, pression, location, pluviométrie, etc) ou de tous les capteurs.

    **- Paramètres:**       <br/>**capteur_type**: all/press/temp/hygro/pluvio/lum/wind_mean/wind_dir/location/rain.
    
    **- Requête:**
```
http://piensg010:3001/last?capteur_type=all
```
ou
```
http://piensg010:3001/last?capteur_type=temp
```
<br/>       **- Réponse:**
<br/>__Pour tous les capteurs__
```
{
    "id": "010",
    "name": "sonde YSH",
    "measurements": {
        "date": "2019-01-31T17:32:04.561Z",
        "temp": -31.431,
        "hygro": 22.826,
        "press": 978.383,
        "lum": 8571,
        "wind_dir": 181.636050594649,
        "wind_mean": 38.2,
        "wind_min": 67,
        "wind_max": 23.9
    },
    "location": {
        "lat": 49.45398333333333,
        "lng": -3.294766666666667,
        "date": "2019-01-31T17:32:04.560Z"
    },
    "rain": "2019-01-31T17:31:45.696Z"
}
```

__Pour un capteur en particulier (exemple: température)__
```
{
    "id": "010",
    "name": "sonde YSH",
    "measurements": {
        "date": "2019-01-31T17:32:34.666Z",
        "temp": -31.552
    }
}
```

__Pour le GPS:__
```
{
    "id": "010",
    "name": "sonde YSH",
    "location": {
        "lat": 49.45458333333333,
        "lng": -3.294766666666667,
        "date": "2019-01-31T17:33:04.770Z"
    }
}
```

__Pour la pluviométrie:__
{
    "id": "010",
    "name": "sonde YSH",
    "rain": "2019-01-31T17:33:25.857Z"
}

2. Récupération d'un échantillon de données (un ou tous les capteurs) sur une période donnée.

    **- Paramètres:** 
        <br/>**capteur_type:** all/press/temp/hygro/pluvio/lum/wind_mean/wind_dir/location/rain.
        <br/>**dateStart:** timestamp.
        <br/>**dateEnd:** timestamp.
    <br/>**- Requête:**
```
piensg010:3001/period?capteur_type=all&dateStart=1548437251&dateEnd=1548955651
```
ou
```
piensg010:3001/period?capteur_type=rain&dateStart=1548437251&dateEnd=1548955651
```
<br/>   **- Réponse:**
```
{
  "id”: "010",
  "name": "SONDE YSH",
  "data”: [
{  
   "measurements": {
       "date": "2019-01-18T13:51:34.900483",
       "press": 1011.511475,
       "temp": -30.616123,
       "hygro": 22.950287,
       "lum": 14,
       "wind_mean": 3.1,
       "wind_dir": 169.663766324064
   },
   "location": {
       "latitude": 51.368464,
       "longitude": 3.458852,
       "date": "2019-01-18T13:51:34.900483"
   }
},
{  "measurements": {
       "date": "2019-01-18T13:51:44.900483",
       "press": 1011.5013,
       "temp": -30.612456,
       "hygro": 21.950287,
       "lum": 14,
       "wind_mean": 3.1,
       "wind_dir": 182.582881100820
   },
   "location": {
       "lat": 51.368464,
       "lng": 3.458842,
       "date": "2019-01-18T13:51:44.900483"
   }
}
],
“rain”:[
"2019-01-18T13:51:34.900483",
"2019-01-18T13:51:38.900483",
…,
    ]

}
```

### Auteurs
Yassmine BOUDILI - Hiba GHADHAB - Sinda THAALBI.  
<br/>
Janvier 2019.



