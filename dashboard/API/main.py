# -*- coding: utf-8 -*-
import pandas as pd

from typing import List
from typing import Optional

from fastapi import FastAPI

from pydantic import BaseModel



# +
## Añade los paths de los modulos

import os
import sys
import dotenv

dotenv.load_dotenv()
repo = os.environ.get('REPO')

def prepare_path(folders=['notebooks/utils', 'src']):
    for folder in folders:
        sys.path.append(
            repo + "/" + folder + "/"
        )
    return sys.path 
        
prepare_path()
# -



from commons import *
from fincaraiz_commons import *
from exploration_commons import *



# +
class Coordinate(BaseModel):
    lat: float
    lon: float

class CoordinateList(BaseModel):
    coordinates: List[Coordinate]
        
def filter_posts_by_coordinates(coordinates):
    results = pd.read_parquet('../../data/posts/2020-09-26/clean/apartamentos/manizales-venta/posts.parquet')
    results = results.loc[:, ["surface", "price", "estrato", "admon"]]
    return list(results.T.to_dict().values())

def get_villavicencio_schools():
    places = pd.read_parquet('../../data/external/2020-09-26/villavicencio/places/puntos_interes.parquet')
    clusters_df = compute_clusters(places.loc[places["amenity"] == "school"], min_samples=5)
    clusters_df = clusters_df[['cluster_latitude', 'cluster_longitude']].drop_duplicates()
    return list(clusters_df.T.to_dict().values())
# -


SCRAPING_DATE = "2020-09-26"

## INSTALL: sudo pip3 install uvicorn fastapi
## RUN: /home/runner/.local/bin/uvicorn main:app --host 0.0.0.0 --reload
app = FastAPI()



# +
"""
curl -D - -XPOST localhost:8000/posts --data '
{"coordinates": [
 {"lat": 1.0, "lon": 2.0},
 {"lat": 1.0, "lon": 2.0},
 {"lat": 1.0, "lon": 2.0},
 {"lat": 1.0, "lon": 2.0}
]}
'
"""

@app.post("/{city}/posts/{property_type}/{post_type}/")
def get_posts(coordinates: CoordinateList): 
    return {
        'results': filter_posts_by_coordinates(coordinates)
    }

"""
I am expecting the map bounds, the bounds are defined by 4 points, to filter the results within the bounds I only need
to check that the coordinate lies whithin the 4 points.
"""
@app.get("/{city}/posts/{property_type}/{post_type}/")
def get_all__a():
    filename = repo + f"/data/posts/{SCRAPING_DATE}/" + "{city}/{property_type}/{post_type}/posts.parquet"
    df = pd.read_parquet(filename)
    return {
        'results': None
    }
# -



# +
def safe_compute_clusters(df):
    min_samples = 5
    clusters_df = compute_clusters(df, min_samples=min_samples)
    while clusters_df.shape[0] == 0:
        min_samples -= 1
        clusters_df = compute_clusters(df, min_samples=min_samples)
    clusters_df = clusters_df[['cluster_latitude', 'cluster_longitude']].drop_duplicates()
    clusters_df.columns = ['lat', 'lon']
    return list(clusters_df.T.to_dict().values())
        
def cluster_amenities(coordinates):
    df = pd.DataFrame(coordinates)
    df.columns = ['lat', 'lon']
    df.loc[:, 'lat'] = df['lat'].apply(float)
    df.loc[:, 'lon'] = df['lon'].apply(float)
    if df.shape[0] < 10:
        return list(df.T.to_dict().values())
    return safe_compute_clusters(df)


def load_external_data(city):
    filename = repo + f"/data/external/{SCRAPING_DATE}/" + "{city}/places/puntos_interes.parquet"
    df = pd.read_parquet(filename.format(city=city))
    return df.loc[:, ['lat', 'lon', 'amenity']]
    
def compute_amenities_locations(df):
    amenities = df.groupby('amenity').agg(lambda e: list(e)).apply(lambda e: list(zip(e['lat'],e['lon'])), axis=1)
    amenities = amenities.to_frame().reset_index()
    amenities.columns = ['amenity', 'coordinates']
    
    return amenities.apply(lambda e: {e['amenity']: cluster_amenities(e['coordinates'])}, axis=1).to_list()
# -



# +
"""
curl -D - -XGET localhost:8000/manizales/external/all
"""

@app.get("/{city}/external/all")
def external_get_all(city):
    city_df = load_external_data(city)
    amenities_json = compute_amenities_locations(city_df)
    return {
        'results': amenities_json
    }

def filter_by_coordinates(df, coordinates):
    lat_bounds = map(lambda e: e.lat, coordinates)
    lat_min = min(lat_bounds)
    lat_max = max(lat_bounds)
    
    lon_bounds = map(lambda e: e.lon, coordinates)
    lon_min = min(lon_bounds)
    lon_max = max(lon_bounds)
    
    condition = df['lat'] >= lat_min
    condition &= df['lat'] <= lat_max
    condition &= df['lon'] >= lon_min
    condition &= df['lon'] <= lon_max
    
    return df.loc[condition]


"""
curl -D - -XGET localhost:8000/manizales/external/all --data '
{"coordinates": [
 {"lat": 4.962399100000000, "lon": -75.62172120000000},
 {"lat": 5.180168500000000, "lon": -75.62172120000000},
 {"lat": 4.962399100000000, "lon": -75.36892730000000},
 {"lat": 5.180168500000000, "lon": -75.36892730000000}
]}
'
"""
@app.get("/{city}/external/all")
def external_get_filtered(coordinates: CoordinateList):
    city_df = load_external_data(city)
    city_df = filter_by_coordinates(city_df, coordinates)
    amenities_json = compute_amenities_locations(city_df)
    return {
        'results': amenities_json
    }
# -





# +
"""
curl -D - -XGET localhost:8000/posts --data '
{"coordinates": [
 {"lat": 1.0, "lon": 2.0},
 {"lat": 1.0, "lon": 2.0},
 {"lat": 1.0, "lon": 2.0},
 {"lat": 1.0, "lon": 2.0}
]}
'
"""

@app.get("/posts")
def get_posts_get():
    return {
        'results': filter_posts_by_coordinates(None)
    }


@app.get("/villavicencio")
def get_villavicencio():
    return {
        'results': get_villavicencio_schools()
    }
