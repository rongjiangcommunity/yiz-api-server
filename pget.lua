local data = {}

for _,k in ipairs(redis.call('keys', ARGV[1])) do
  if redis.pcall('TYPE', k).ok == 'string' then
    data[k] = redis.call('GET', k)
  end
end
return cjson.encode(data)
