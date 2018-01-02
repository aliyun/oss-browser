#include <nan.h>
#include "crc64_ecma_182.h"

namespace CRC64JS {

static uint64_t ZERO = 0;

NAN_METHOD(CRC64)
{
    v8::Local<v8::Object> buff = Nan::To<v8::Object>(info[0]).ToLocalChecked();
    v8::Local<v8::Object> ret;

    if(info.Length() > 1)
    {
        ret = Nan::To<v8::Object>(info[1]).ToLocalChecked();
    }
    else
    {
        ret = Nan::CopyBuffer((char*)&ZERO, sizeof(ZERO)).ToLocalChecked();
    }

    uint64_t* crc = (uint64_t*)node::Buffer::Data(ret);
    void* orig_buff = node::Buffer::Data(buff);
    *crc = crc64js_base::crc64(*crc, orig_buff, node::Buffer::Length(buff));

    info.GetReturnValue().Set(ret);
}

NAN_METHOD(ToUInt64String)
{
    v8::Local<v8::Object> ret = Nan::To<v8::Object>(info[0]).ToLocalChecked();

    uint64_t* crc = (uint64_t*)node::Buffer::Data(ret);
    char str[32];
    sprintf(str, "%llu", *crc);

    info.GetReturnValue().Set(Nan::New(str).ToLocalChecked());
}

NAN_MODULE_INIT(Init)
{
    crc64js_base::crc64_init();
    Nan::Export(target, "crc64", CRC64);
    Nan::Export(target, "toUInt64String", ToUInt64String);
}

NODE_MODULE(crc64, Init)

}
