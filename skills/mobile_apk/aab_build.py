#!/usr/bin/env python3
import json,sys

if __name__ == "__main__":
    payload={"skill":"aab_build","category":"mobile_apk","args":sys.argv[1:]}
    print(json.dumps(payload))
