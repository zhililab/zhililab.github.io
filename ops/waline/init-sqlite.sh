#!/bin/sh

set -eu

data_dir=${1:-./data}
database="${data_dir}/waline.sqlite"
candidate="${database}.download"
template_url='https://raw.githubusercontent.com/walinejs/waline/main/assets/waline.sqlite'
template_sha256='ac08959a80b2756701742d97ad445fab24597428b3bc56e0c87541c4ea8b1b37'

if [ -s "$database" ]; then
  exit 0
fi

mkdir -p "$data_dir"
trap 'rm -f "$candidate"' EXIT
curl --fail --location --retry 3 --connect-timeout 10 \
  --output "$candidate" "$template_url"

printf '%s  %s\n' "$template_sha256" "$candidate" | sha256sum --check -
chmod 640 "$candidate"
mv "$candidate" "$database"
trap - EXIT
