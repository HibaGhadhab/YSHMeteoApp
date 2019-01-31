# TSI-Météo /Backend 

### Description 
Ce répertoire *YSHMeteoApp* représente la partie backend du projet TSI-Météo, il s'agit du service web réalisé pour la sonde numéro 10 du projet JavaScript avancé (TSI 2018/2019, Ecole Nationale des Sciences Géographiques).
Ce service web a été crée avec:
- ***ExpressJS***: framework pour la construction de l'application.
- ***MongoDB***: gestion de la base de données. (version: 2.4.14)

### Le service
Le service web réalisé a été défini comme un service système: *tsimeteo.service* disponible sur la raspberry pi *piensg010*. il est lancé au démarrage et permet d'accéder à l'API mis en place.

### Utilisation de l'API
L'API est accessible sur l'adresse http://piensg010:3001 depuis le réseau de l'Ecole Nationale des Sciences Géographiques. Il expose les services suivants : 

1. **Récupération de la dernière valeur d'une donnée d'un capteur (température, pression, location, pluviométrie, etc) ou de tous les capteurs.**

    - _Paramètres:_       <br/>*capteur_type*: all/press/temp/hygro/pluvio/lum/wind_mean/wind_dir/location/rain.
    
    - _Requête:_
```
http://piensg010:3001/last?capteur_type=all
```
ou
```
http://piensg010:3001/last?capteur_type=temp
```
   
   - _Réponse:_
<br/>Pour tous les capteurs
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

Pour un capteur en particulier (exemple: température)
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

Pour le GPS:
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

Pour la pluviométrie:
```
{
    "id": "010",
    "name": "sonde YSH",
    "rain": "2019-01-31T17:33:25.857Z"
}
```
2. **Récupération d'un échantillon de données (un ou tous les capteurs) sur une période donnée.**

     - _Paramètres:_ 
        <br/>*capteur_type:* all/press/temp/hygro/pluvio/lum/wind_mean/wind_dir/location/rain.
        <br/>*dateStart:* timestamp.
        <br/>*dateEnd:* timestamp.
    - _Requête:_
```
piensg010:3001/period?capteur_type=all&dateStart=1548437251&dateEnd=1548955651
```
ou
```
piensg010:3001/period?capteur_type=rain&dateStart=1548437251&dateEnd=1548955651
```
   
   - _Réponse:_
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
### Installation du service
Pour installer et utiliser le service localement sur votre machine vous devez disposer de:
- ***npm version***: 6.4.1
- ***Mongodb version***: MongoDB shell version: 2.4.14
<br/>
Clonez le répertoire et installez ensuite les dépendances:
```
npm install
```
Enfin démarrez le service:
```
npm start
```
le service sera disponible sur l'addresse *http:localhost:3001*

### Auteurs
Yassmine BOUDILI - Hiba GHADHAB - Sinda THAALBI.  
<br/>
Janvier 2019.



