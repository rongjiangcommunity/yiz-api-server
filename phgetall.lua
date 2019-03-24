local collate = function (key)
  local raw_data = redis.call('HGETALL', key)
  local hash_data = {}
  for idx = 1, #raw_data, 2 do
    hash_data[raw_data[idx]] = raw_data[idx + 1]
  end
  return hash_data;
end
local data = {}

for _,k in ipairs(redis.call('keys', ARGV[1])) do
  if redis.pcall('TYPE', k).ok == 'hash' then
    data[k] = collate(k)
  end
end
return cjson.encode(data)
