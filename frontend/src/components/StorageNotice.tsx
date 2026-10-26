import {useStorageNotice} from '../lib/sessionStorage'
export function StorageNotice(){const message=useStorageNotice();return message?<div role="status" className="storage-notice">{message}</div>:null}
