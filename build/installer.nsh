; Custom NSIS installer script for BMusic
; Auto-appends \bmusic subfolder when user selects a bare drive root

!macro customInstallDir
  ; If the user chose a drive root like "D:\" or "E:\", append \bmusic
  StrLen $0 $INSTDIR
  ${If} $0 <= 3
    StrCpy $INSTDIR "$INSTDIR\bmusic"
  ${Else}
    ; Also check if it doesn't already end with \bmusic
    ${WordFind} "$INSTDIR" "\bmusic" "E+1}" $1
    IfErrors 0 +2
      StrCpy $INSTDIR "$INSTDIR\bmusic"
  ${EndIf}
!macroend

!macro customInit
  ; Ensure default install dir includes the app name
  StrCpy $INSTDIR "$PROGRAMFILES\bmusic"
!macroend
