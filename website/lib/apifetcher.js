/*
Fetcher for api requests
---------------
use it like this:

const { data, error } = useSWRImmutable(['/api/loginWithCalenderCode', {'code': code}], getApiFetcher())
-------------------------
with mounted:

const { data, error } = useSWRImmutable(mounted ? ['/api/loginWithCalenderCode', {'code': code}] : null, getApiFetcher())
--------------------------
with callback:

const { data, error } = useSWRImmutable(code ? ['/api/loginWithCalenderCode', {'code': code}] : null, getApiFetcher(
    (res) => {
      //code
      return res
    }
  ))
------------------------
*/


//url, payload, callback //normal fetch
//url, callback //normal fetch
//url, payload //normal fetch
//callback //für swr
export function getApiFetcher(...args) {

  let url //string
  let payload //objekt -> for json
  let callback //funktion

  args.forEach(element => {
    if (typeof element === 'function') {
      callback = element
    }
    if (typeof element === 'string') {
      url = element
    }
    if (typeof element === 'object') {
      payload = element
    }
  });

  const apiFetcher = (url, payload) => 
  fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(payload)
  }).then(r => r.json())

  if(callback){
    return (...args) => apiFetcher(...args).then(callback)
  }else{
    return (...args) => apiFetcher(...args)
  }
}


export const apiFetcher = (url, payload) => 
fetch('/api/'+url, {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  method: 'POST',
  body: JSON.stringify(payload)
})
